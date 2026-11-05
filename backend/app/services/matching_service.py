import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.surplus import SurplusListing
from app.models.organization import Organization
from app.models.match import MatchRecommendation, DonationMatch


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on Earth."""
    r = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def evaluate_hard_filters(listing: SurplusListing, recipient: Organization) -> Tuple[bool, List[str]]:
    """Evaluate Tier 1 hard constraints. Returns (is_eligible, list_of_failure_reasons)."""
    failures = []

    # 1. Verification status
    if recipient.verification_status != "verified":
        failures.append("Recipient organization is not yet verified by platform administrators.")

    # 2. Capacity threshold
    if recipient.capacity_value < listing.quantity_value:
        failures.append(
            f"Insufficient capacity: listing requires {listing.quantity_value} {listing.quantity_unit}, "
            f"recipient has {recipient.capacity_value} {recipient.capacity_unit}."
        )

    # 3. Handling & Storage compatibility
    req_storage = (listing.storage_requirement or "ambient").lower()
    capabilities = recipient.handling_capabilities or {}
    
    if req_storage != "ambient":
        # Must have capability set to True
        has_storage = capabilities.get(req_storage, False) or capabilities.get(f"supports_{req_storage}", False)
        if not has_storage:
            failures.append(f"Storage mismatch: recipient lacks verified '{req_storage}' handling capacity.")

    # 4. Service area / Distance
    donor = listing.donor_organization
    if (donor and donor.latitude is not None and donor.longitude is not None and
            recipient.latitude is not None and recipient.longitude is not None):
        dist = haversine_distance(donor.latitude, donor.longitude, recipient.latitude, recipient.longitude)
        max_dist = recipient.service_radius_km or 25.0
        if dist > max_dist:
            failures.append(f"Outside service area: {dist:.1f} km away exceeds recipient radius of {max_dist:.1f} km.")

    # 5. Pickup deadline viability
    now = datetime.now(timezone.utc)
    deadline = listing.pickup_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if deadline <= now:
        failures.append("Listing pickup deadline has already expired.")

    return (len(failures) == 0, failures)


def calculate_soft_score(
    listing: SurplusListing,
    recipient: Organization,
    db: Session
) -> Tuple[float, List[Dict[str, str]]]:
    """Calculate Tier 2 normalized multi-factor soft ranking score (0 - 100) and reason tags."""
    reasons: List[Dict[str, str]] = []
    total_score = 0.0

    # 1. Proximity score (0 to 30 pts)
    donor = listing.donor_organization
    dist_km = 4.5  # default estimate
    if (donor and donor.latitude is not None and donor.longitude is not None and
            recipient.latitude is not None and recipient.longitude is not None):
        dist_km = haversine_distance(donor.latitude, donor.longitude, recipient.latitude, recipient.longitude)
    
    radius = recipient.service_radius_km or 20.0
    proximity_ratio = max(0.0, 1.0 - (dist_km / radius))
    proximity_points = proximity_ratio * 30.0
    total_score += proximity_points
    reasons.append({
        "code": "PROXIMITY_FIT",
        "label": f"Located {dist_km:.1f} km away (within {radius:.0f} km service zone)"
    })

    # 2. Capacity fit score (0 to 25 pts)
    # Optimal fit is when listing takes 40% - 85% of recipient capacity
    ratio = listing.quantity_value / max(recipient.capacity_value, 1.0)
    if 0.3 <= ratio <= 0.9:
        capacity_points = 25.0
        reasons.append({
            "code": "OPTIMAL_CAPACITY",
            "label": f"Optimal volume match: fills {int(ratio*100)}% of recipient capacity"
        })
    else:
        capacity_points = max(10.0, 25.0 * (1.0 - abs(0.6 - ratio)))
        reasons.append({
            "code": "CAPACITY_AVAILABLE",
            "label": f"Sufficient capacity available ({recipient.capacity_value} {recipient.capacity_unit} limit)"
        })
    total_score += capacity_points

    # 3. Storage and handling verification (0 to 25 pts)
    req_storage = (listing.storage_requirement or "ambient").lower()
    capabilities = recipient.handling_capabilities or {}
    if req_storage == "ambient" or capabilities.get(req_storage):
        total_score += 25.0
        reasons.append({
            "code": "STORAGE_VERIFIED",
            "label": f"Verified {req_storage.replace('_', ' ').capitalize()} storage verified"
        })
    else:
        total_score += 10.0

    # 4. Fairness and Rotation (0 to 20 pts)
    # Check recent completed matches
    recent_matches = db.query(DonationMatch).filter(
        DonationMatch.recipient_organization_id == recipient.id,
        DonationMatch.status == "completed"
    ).count()

    if recent_matches == 0:
        rotation_points = 20.0
        reasons.append({
            "code": "FAIRNESS_BOOST",
            "label": "High priority: recipient has high unmet community demand"
        })
    elif recent_matches < 5:
        rotation_points = 16.0
        reasons.append({
            "code": "PROVEN_PARTNER",
            "label": "Active partner with consistent community distribution"
        })
    else:
        rotation_points = 12.0
    total_score += rotation_points

    # Final clamped score
    final_score = round(min(100.0, max(0.0, total_score)), 1)
    return final_score, reasons


def rank_recipients_for_listing(db: Session, listing_id: str) -> List[Dict[str, Any]]:
    """Rank all eligible recipient organizations for a given surplus listing."""
    listing = db.query(SurplusListing).filter(SurplusListing.id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Surplus listing with id {listing_id} not found.")

    # Fetch recipient organizations
    recipients = db.query(Organization).filter(
        Organization.type.in_(["ngo", "shelter", "community_kitchen", "food_bank", "charity"])
    ).all()

    recommendations = []
    for recipient in recipients:
        is_eligible, failure_reasons = evaluate_hard_filters(listing, recipient)
        
        if is_eligible:
            score, reason_codes = calculate_soft_score(listing, recipient, db)
            recommendations.append({
                "id": str(recipient.id),
                "listing_id": str(listing.id),
                "recipient_organization_id": str(recipient.id),
                "recipient_organization_name": recipient.name,
                "recipient_organization_address": recipient.address,
                "eligibility_status": "eligible",
                "score": score,
                "reason_codes": reason_codes,
                "model_version": "hybrid-rules-ranker-v1.2",
                "created_at": datetime.now(timezone.utc).isoformat()
            })

    # Sort descending by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations


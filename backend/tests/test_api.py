import pytest
from datetime import datetime, timedelta, timezone


def test_health_check(client):
    """Test health endpoint responds healthy with db check."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "healthy"
    assert "version" in data


def test_auth_registration_and_login(client):
    """Test registering a new donor organization and logging in."""
    reg_payload = {
        "email": "test_chef@restaurant.demo",
        "password": "securepassword123",
        "full_name": "Test Chef",
        "role": "donor",
        "organization_name": "Test Trattoria",
        "organization_type": "restaurant",
        "organization_address": "123 Pasta Lane",
        "organization_latitude": 37.77,
        "organization_longitude": -122.42,
        "capacity_value": 100.0,
        "capacity_unit": "kg",
        "handling_capabilities": {"ambient": True, "refrigerated": True}
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "test_chef@restaurant.demo"
    assert reg_data["user"]["role"] == "donor"

    # Now login with the same credentials
    login_payload = {
        "email": "test_chef@restaurant.demo",
        "password": "securepassword123"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == "test_chef@restaurant.demo"


def test_surplus_listing_lifecycle(client):
    """Test creating, validating, publishing, and retrieving a surplus listing."""
    # Register donor
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "lifecycle_donor@test.demo",
        "password": "password123",
        "full_name": "Lifecycle Donor",
        "role": "donor",
        "organization_name": "Lifecycle Kitchen",
        "organization_type": "caterer",
        "organization_address": "500 Event Pl",
        "capacity_value": 200.0,
        "capacity_unit": "portions"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a draft listing
    now = datetime.now(timezone.utc)
    future_deadline = (now + timedelta(hours=8)).isoformat()
    create_payload = {
        "title": "Fresh Catering Trays",
        "food_category": "prepared_meals",
        "description": "Assorted Mediterranean pasta and salads",
        "quantity_value": 35.0,
        "quantity_unit": "portions",
        "pickup_deadline_at": future_deadline,
        "storage_requirement": "refrigerated",
        "allergens": ["gluten", "dairy"],
        "dietary_tags": ["vegetarian"],
        "publish_immediately": False
    }
    create_res = client.post("/api/v1/surplus-listings", json=create_payload, headers=headers)
    assert create_res.status_code == 200
    listing = create_res.json()
    assert listing["status"] == "draft"
    listing_id = listing["id"]

    # 2. Publish the draft listing
    pub_res = client.post(f"/api/v1/surplus-listings/{listing_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "available"

    # 3. Retrieve listing
    get_res = client.get(f"/api/v1/surplus-listings/{listing_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Fresh Catering Trays"


def test_matching_and_claim_flow(client):
    """Test matching recommendations, claim acceptance by recipient, and scheduling."""
    # Register donor
    donor_res = client.post("/api/v1/auth/register", json={
        "email": "match_donor@demo.com",
        "password": "password123",
        "full_name": "Match Donor",
        "role": "donor",
        "organization_name": "Donor Cafe",
        "organization_type": "restaurant",
        "organization_address": "100 Market St",
        "organization_latitude": 37.78,
        "organization_longitude": -122.41,
        "capacity_value": 100.0
    })
    donor_token = donor_res.json()["access_token"]
    donor_headers = {"Authorization": f"Bearer {donor_token}"}

    # Register recipient
    recip_res = client.post("/api/v1/auth/register", json={
        "email": "match_recip@demo.com",
        "password": "password123",
        "full_name": "Match Recipient",
        "role": "recipient",
        "organization_name": "Recip Pantry",
        "organization_type": "community_kitchen",
        "organization_address": "105 Market St",
        "organization_latitude": 37.782,
        "organization_longitude": -122.408,
        "service_radius_km": 10.0,
        "capacity_value": 150.0,
        "capacity_unit": "portions",
        "handling_capabilities": {"ambient": True, "refrigerated": True}
    })
    recip_token = recip_res.json()["access_token"]
    recip_org_id = recip_res.json()["user"]["organization_id"]
    recip_headers = {"Authorization": f"Bearer {recip_token}"}

    # Create available listing
    now = datetime.now(timezone.utc)
    listing_res = client.post("/api/v1/surplus-listings", json={
        "title": "Matchable Salad Bowls",
        "food_category": "prepared_meals",
        "quantity_value": 25.0,
        "quantity_unit": "portions",
        "pickup_deadline_at": (now + timedelta(hours=6)).isoformat(),
        "storage_requirement": "refrigerated",
        "publish_immediately": True
    }, headers=donor_headers)
    listing_id = listing_res.json()["id"]

    # Since recipient starts as "pending", approve via admin or verify hard filter blocks unverified
    # 1. First verify recipient cannot accept while pending
    unverified_claim = client.post(f"/api/v1/matches/accept/{listing_id}", headers=recip_headers)
    assert unverified_claim.status_code == 403  # Forbidden because unverified!

    # 2. Register admin and verify recipient organization
    admin_res = client.post("/api/v1/auth/register", json={
        "email": "test_admin@platform.demo",
        "password": "password123",
        "full_name": "Test Admin",
        "role": "admin"
    })
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    verify_res = client.post(f"/api/v1/admin/organizations/{recip_org_id}/verify", json={
        "verification_status": "verified",
        "reason": "Test verification approval"
    }, headers=admin_headers)
    assert verify_res.status_code == 200

    # 3. Now verified recipient can query match recommendations and accept
    recs_res = client.get(f"/api/v1/matches/recommendations/{listing_id}")
    assert recs_res.status_code == 200
    recommendations = recs_res.json()
    assert len(recommendations) >= 1
    assert recommendations[0]["score"] > 0
    assert len(recommendations[0]["reason_codes"]) > 0

    # 4. Accept donation
    accept_res = client.post(f"/api/v1/matches/accept/{listing_id}", headers=recip_headers)
    assert accept_res.status_code == 200
    match_data = accept_res.json()
    assert match_data["status"] == "accepted"
    match_id = match_data["id"]

    # 5. Schedule pickup
    sched_payload = {
        "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
        "pickup_window_end": (now + timedelta(hours=3)).isoformat()
    }
    sched_res = client.post(f"/api/v1/matches/{match_id}/schedule", json=sched_payload, headers=donor_headers)
    assert sched_res.status_code == 200
    assert sched_res.json()["status"] == "scheduled"

    # 6. Record handoff event
    event_payload = {
        "event_type": "collected",
        "quantity_value": 25.0,
        "quantity_unit": "portions",
        "notes": "Picked up from kitchen"
    }
    event_res = client.post(f"/api/v1/pickups/{match_id}/events", json=event_payload, headers=recip_headers)
    assert event_res.status_code == 200
    assert event_res.json()["event_type"] == "collected"


def test_impact_analytics(client):
    """Test analytics endpoint calculates valid stats based on database records."""
    response = client.get("/api/v1/analytics/impact")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "categories" in data
    assert "monthly_trends" in data
    assert "methodology_notes" in data
    assert "meals_estimate" in data["methodology_notes"]


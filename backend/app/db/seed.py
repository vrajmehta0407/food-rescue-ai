from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User
from app.models.surplus import SurplusListing
from app.models.match import DonationMatch, MatchRecommendation
from app.models.pickup import HandoffEvent
from app.models.notification import Notification
from app.models.audit import AuditLog

# Ensure all tables exist
Base.metadata.create_all(bind=engine)


def seed_database():
    """Seed comprehensive, explicitly labeled [DEMO] records across all user roles."""
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@foodrescue.ai").first()
        if existing_admin:
            print("Database already contains seed data. Skipping re-seed.")
            return

        print("Seeding FoodRescue AI demo organizations and users...")
        now = datetime.now(timezone.utc)
        default_pw = get_password_hash("password123")

        # 1. Organizations
        # Donor Org 1: Green Garden Bistro
        org_bistro = Organization(
            name="[DEMO] Green Garden Bistro",
            type="restaurant",
            verification_status="verified",
            address="452 Market Street, Downtown",
            latitude=37.7891,
            longitude=-122.4014,
            service_radius_km=15.0,
            capacity_value=120.0,
            capacity_unit="portions",
            handling_capabilities={"ambient": True, "refrigerated": True, "hot_holding": True, "frozen": False},
            contact_email="donor@bistro.demo",
            contact_phone="+1 (555) 234-5678"
        )
        db.add(org_bistro)

        # Donor Org 2: Golden Crust Bakery
        org_bakery = Organization(
            name="[DEMO] Golden Crust Bakery",
            type="bakery",
            verification_status="verified",
            address="1208 Pine Street, Nob Hill",
            latitude=37.7905,
            longitude=-122.4158,
            service_radius_km=10.0,
            capacity_value=80.0,
            capacity_unit="kg",
            handling_capabilities={"ambient": True, "refrigerated": False, "hot_holding": False, "frozen": False},
            contact_email="bakery@artisan.demo",
            contact_phone="+1 (555) 345-6789"
        )
        db.add(org_bakery)

        # Recipient Org 1: Hope Community Kitchen (Verified)
        org_hope = Organization(
            name="[DEMO] Hope Community Kitchen",
            type="community_kitchen",
            verification_status="verified",
            address="784 Mission Street, SoMa",
            latitude=37.7858,
            longitude=-122.4042,
            service_radius_km=20.0,
            capacity_value=250.0,
            capacity_unit="portions",
            handling_capabilities={"ambient": True, "refrigerated": True, "frozen": True, "hot_holding": True},
            contact_email="director@hopekitchen.demo",
            contact_phone="+1 (555) 456-7890"
        )
        db.add(org_hope)

        # Recipient Org 2: St. Jude Shelter (Verified)
        org_haven = Organization(
            name="[DEMO] St. Jude Shelter",
            type="shelter",
            verification_status="verified",
            address="915 Folsom Street, South of Market",
            latitude=37.7794,
            longitude=-122.4061,
            service_radius_km=12.0,
            capacity_value=150.0,
            capacity_unit="portions",
            handling_capabilities={"ambient": True, "refrigerated": True, "frozen": False, "hot_holding": False},
            contact_email="shelter@haven.demo",
            contact_phone="+1 (555) 567-8901"
        )
        db.add(org_haven)

        # Recipient Org 3: New Horizons Pantry (Pending Verification for Admin Queue)
        org_pending = Organization(
            name="[DEMO] New Horizons Food Pantry",
            type="food_bank",
            verification_status="pending",
            address="332 Valencia Street, Mission District",
            latitude=37.7667,
            longitude=-122.4221,
            service_radius_km=25.0,
            capacity_value=300.0,
            capacity_unit="kg",
            handling_capabilities={"ambient": True, "refrigerated": True, "frozen": True, "hot_holding": False},
            contact_email="pending@newcharity.demo",
            contact_phone="+1 (555) 678-9012"
        )
        db.add(org_pending)
        db.flush()

        # 2. Users
        # Admin
        user_admin = User(
            email="admin@foodrescue.ai",
            password_hash=default_pw,
            full_name="Platform Administrator",
            role="admin",
            organization_id=None,
            is_active=True
        )
        db.add(user_admin)

        # Donor 1 User
        user_donor1 = User(
            email="donor@bistro.demo",
            password_hash=default_pw,
            full_name="Chef Marco Rossi",
            role="donor",
            organization_id=org_bistro.id,
            is_active=True
        )
        db.add(user_donor1)

        # Donor 2 User
        user_donor2 = User(
            email="bakery@artisan.demo",
            password_hash=default_pw,
            full_name="Sarah Jenkins (Head Baker)",
            role="donor",
            organization_id=org_bakery.id,
            is_active=True
        )
        db.add(user_donor2)

        # Recipient 1 User
        user_recipient1 = User(
            email="director@hopekitchen.demo",
            password_hash=default_pw,
            full_name="Rev. David Miller",
            role="recipient",
            organization_id=org_hope.id,
            is_active=True
        )
        db.add(user_recipient1)

        # Recipient 2 User
        user_recipient2 = User(
            email="shelter@haven.demo",
            password_hash=default_pw,
            full_name="Elena Rostova",
            role="recipient",
            organization_id=org_haven.id,
            is_active=True
        )
        db.add(user_recipient2)

        # Pending Org User
        user_pending = User(
            email="pending@newcharity.demo",
            password_hash=default_pw,
            full_name="Marcus Vance",
            role="recipient",
            organization_id=org_pending.id,
            is_active=True
        )
        db.add(user_pending)

        # Volunteer User
        user_volunteer = User(
            email="volunteer@rescue.demo",
            password_hash=default_pw,
            full_name="Alex Taylor (Logistics)",
            role="volunteer",
            organization_id=None,
            is_active=True
        )
        db.add(user_volunteer)
        db.flush()

        # 3. Active & Completed Surplus Listings
        # Listing 1: Active Dinner Surplus (Available)
        listing1 = SurplusListing(
            donor_organization_id=org_bistro.id,
            title="[DEMO] Roasted Herb Chicken & Seasonal Garden Medley",
            food_category="prepared_meals",
            description="Freshly prepared roasted chicken breast with rosemary, roasted root vegetables, and wild rice pilaf. Packaged in sanitized food-grade aluminum catering containers.",
            quantity_value=45.0,
            quantity_unit="portions",
            prepared_at=now - timedelta(hours=2),
            best_before_at=now + timedelta(hours=20),
            pickup_deadline_at=now + timedelta(hours=6),
            storage_requirement="refrigerated",
            allergens=["celery"],
            dietary_tags=["halal", "gluten_free"],
            status="available",
            notes="Please access via rear service alley door on Stevenson St."
        )
        db.add(listing1)

        # Listing 2: Active Bakery Surplus (Available)
        listing2 = SurplusListing(
            donor_organization_id=org_bakery.id,
            title="[DEMO] Artisan Sourdough Boules & Morning Brioche",
            food_category="bakery",
            description="Surplus daily bake: 24 country sourdough loaves and 30 assorted brioche rolls. Baked this morning at 5:00 AM.",
            quantity_value=32.0,
            quantity_unit="kg",
            prepared_at=now - timedelta(hours=8),
            best_before_at=now + timedelta(days=2),
            pickup_deadline_at=now + timedelta(hours=10),
            storage_requirement="ambient",
            allergens=["gluten", "dairy", "eggs"],
            dietary_tags=["vegetarian"],
            status="available",
            notes="Packed in clean baker crates. Crates can be exchanged or returned."
        )
        db.add(listing2)

        # Listing 3: Reserved & Scheduled Pickup (Bistro -> Hope Kitchen)
        listing3 = SurplusListing(
            donor_organization_id=org_bistro.id,
            title="[DEMO] Tuscan Vegetable Soup & Focaccia Bread",
            food_category="prepared_meals",
            description="Hearty vegetable minestrone soup and freshly baked olive oil focaccia bread.",
            quantity_value=50.0,
            quantity_unit="portions",
            prepared_at=now - timedelta(hours=4),
            best_before_at=now + timedelta(hours=18),
            pickup_deadline_at=now + timedelta(hours=5),
            storage_requirement="hot_holding",
            allergens=["gluten"],
            dietary_tags=["vegan", "vegetarian"],
            status="pickup_scheduled",
            notes="Hot cambro food containers ready at kitchen back door."
        )
        db.add(listing3)
        db.flush()

        match3 = DonationMatch(
            listing_id=listing3.id,
            recipient_organization_id=org_hope.id,
            status="scheduled",
            accepted_at=now - timedelta(hours=2),
            pickup_window_start=now + timedelta(hours=1),
            pickup_window_end=now + timedelta(hours=3),
            assigned_volunteer_id=user_volunteer.id
        )
        db.add(match3)
        db.flush()

        event3_1 = HandoffEvent(
            match_id=match3.id,
            event_type="accepted",
            quantity_value=50.0,
            quantity_unit="portions",
            occurred_at=now - timedelta(hours=2),
            notes="Accepted by Hope Community Kitchen",
            actor_user_id=user_recipient1.id
        )
        event3_2 = HandoffEvent(
            match_id=match3.id,
            event_type="scheduled",
            occurred_at=now - timedelta(hours=1),
            notes="Pickup scheduled with volunteer Alex Taylor",
            actor_user_id=user_donor1.id
        )
        db.add(event3_1)
        db.add(event3_2)

        # Listing 4: Historical Completed Rescue (for Impact Analytics)
        listing4 = SurplusListing(
            donor_organization_id=org_bistro.id,
            title="[DEMO] Mediterranean Salmon & Couscous Bowls",
            food_category="prepared_meals",
            description="Grilled wild salmon fillets with seasoned lemon couscous and steamed broccoli.",
            quantity_value=60.0,
            quantity_unit="portions",
            prepared_at=now - timedelta(days=2, hours=3),
            best_before_at=now - timedelta(days=1),
            pickup_deadline_at=now - timedelta(days=1, hours=20),
            storage_requirement="refrigerated",
            allergens=["fish", "gluten"],
            dietary_tags=["pescatarian"],
            status="completed",
            notes="Completed smoothly."
        )
        db.add(listing4)
        db.flush()

        match4 = DonationMatch(
            listing_id=listing4.id,
            recipient_organization_id=org_hope.id,
            status="completed",
            accepted_at=now - timedelta(days=2, hours=2),
            pickup_window_start=now - timedelta(days=2, hours=1),
            pickup_window_end=now - timedelta(days=2),
            assigned_volunteer_id=user_volunteer.id
        )
        db.add(match4)
        db.flush()

        event4 = HandoffEvent(
            match_id=match4.id,
            event_type="completed",
            quantity_value=60.0,
            quantity_unit="portions",
            occurred_at=now - timedelta(days=1, hours=22),
            notes="60 hot meals safely distributed to shelter residents.",
            actor_user_id=user_volunteer.id
        )
        db.add(event4)

        # Listing 5: Historical Completed Rescue 2
        listing5 = SurplusListing(
            donor_organization_id=org_bakery.id,
            title="[DEMO] Baguettes, Ciabatta & Sandwich Loaves",
            food_category="bakery",
            description="Assorted crusty sandwich loaves and baguettes.",
            quantity_value=40.0,
            quantity_unit="kg",
            prepared_at=now - timedelta(days=4),
            best_before_at=now - timedelta(days=2),
            pickup_deadline_at=now - timedelta(days=3),
            storage_requirement="ambient",
            allergens=["gluten"],
            dietary_tags=["vegan"],
            status="completed"
        )
        db.add(listing5)
        db.flush()

        match5 = DonationMatch(
            listing_id=listing5.id,
            recipient_organization_id=org_haven.id,
            status="completed",
            accepted_at=now - timedelta(days=4),
            pickup_window_start=now - timedelta(days=3, hours=22),
            pickup_window_end=now - timedelta(days=3, hours=20),
            assigned_volunteer_id=user_volunteer.id
        )
        db.add(match5)
        db.flush()

        event5 = HandoffEvent(
            match_id=match5.id,
            event_type="completed",
            quantity_value=40.0,
            quantity_unit="kg",
            occurred_at=now - timedelta(days=3, hours=20),
            notes="40kg fresh bread delivered to St. Jude food pantry.",
            actor_user_id=user_recipient2.id
        )
        db.add(event5)

        # 4. Notifications
        notif1 = Notification(
            user_id=user_donor1.id,
            type="match_accepted",
            title="Surplus Offer Claimed!",
            body="Hope Community Kitchen accepted your 'Tuscan Vegetable Soup' offer. Pickup is scheduled.",
            link="/dashboard"
        )
        notif2 = Notification(
            user_id=user_recipient1.id,
            type="match_suggestion",
            title="New Surplus Match Available",
            body="Green Garden Bistro listed 45 portions of Roasted Herb Chicken matching your refrigerated capacity.",
            link="/recipient/matches"
        )
        notif3 = Notification(
            user_id=user_admin.id,
            type="admin_alert",
            title="Organization Verification Requested",
            body="New Horizons Food Pantry submitted verification documents and is awaiting your review.",
            link="/admin"
        )
        db.add(notif1)
        db.add(notif2)
        db.add(notif3)

        # 5. Audit Log Records
        audit1 = AuditLog(
            actor_user_id=user_admin.id,
            entity_type="system",
            entity_id="init",
            action="seed_database",
            metadata_json={"status": "demo_data_initialized", "environment": "development"}
        )
        db.add(audit1)

        db.commit()
        print("Demo database seeded successfully with realistic test accounts!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()


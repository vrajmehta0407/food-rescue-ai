from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.surplus import router as surplus_router
from app.api.v1.matches import router as matches_router
from app.api.v1.pickups import router as pickups_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(orgs_router)
api_router.include_router(surplus_router)
api_router.include_router(matches_router)
api_router.include_router(pickups_router)
api_router.include_router(predictions_router)
api_router.include_router(analytics_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)


from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_active_user
from app.services.dashboard_service import dashboard_service
from app.schemas.dashboard import DashboardResponse
import logging

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)

@router.get("/dashboard", response_model=DashboardResponse)
async def get_user_dashboard(current_user: dict = Depends(get_current_active_user)):
    """
    Get comprehensive dashboard data for the current user
    Includes stats, activities, courses, projects, datasets, and recommendations
    """
    try:
        logger.info(f"Fetching dashboard for user {current_user.id}")
        
        dashboard_data = await dashboard_service.get_user_dashboard(current_user.id)
        
        return dashboard_data
    
    except Exception as e:
        logger.error(f"Dashboard error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard data"
        )

@router.get("/quick-stats")
async def get_quick_stats(current_user: dict = Depends(get_current_active_user)):
    """Get only quick statistics for dashboard widgets"""
    try:
        dashboard_data = await dashboard_service.get_user_dashboard(current_user.id)
        
        return {
            "stats": dashboard_data.user_stats,
            "recent_activity_count": len(dashboard_data.recent_activities)
        }
    
    except Exception as e:
        logger.error(f"Quick stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load quick stats")

@router.get("/activities")
async def get_recent_activities(current_user: dict = Depends(get_current_active_user)):
    """Get only recent activities"""
    try:
        dashboard_data = await dashboard_service.get_user_dashboard(current_user.id)
        return {"activities": dashboard_data.recent_activities}
    
    except Exception as e:
        logger.error(f"Activities error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load activities")
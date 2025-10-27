from .auth import router as auth_router
from .users import router as users_router
from .organizations import router as organizations_router
from .education import router as education_router
from .freelancing import router as freelancing_router
from .bi import router as bi_router
from .payments import router as payments_router
from .files import router as files_router
from .dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "users_router", 
    "organizations_router",
    "education_router",
    "freelancing_router",
    "bi_router",
    "payments_router",
    "files_router",
    "dashboard_router",  # Add this

]
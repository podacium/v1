from app.generated.prisma import Prisma
from app.core.config import settings
import logging
import os

# Force Python engine to avoid binary issues
os.environ['PRISMA_USE_PYTHON_ENGINE'] = '1'

logger = logging.getLogger(__name__)

prisma = Prisma()

async def connect_prisma():
    """Connect to the database"""
    try:
        await prisma.connect()
        logger.info("✅ Database connected successfully (Python engine)")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

async def disconnect_prisma():
    """Disconnect from the database"""
    try:
        await prisma.disconnect()
        logger.info("✅ Database disconnected successfully")
    except Exception as e:
        logger.error(f"❌ Database disconnection failed: {e}")

async def get_prisma():
    """Get Prisma instance"""
    return prisma

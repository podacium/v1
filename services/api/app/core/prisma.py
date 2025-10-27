from app.generated.prisma import Prisma
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

prisma = Prisma()

async def connect_prisma():
    """Connect to the database"""
    try:
        await prisma.connect()
        logger.info("✅ Database connected successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # Don't raise for now to allow app to start
        # raise

async def disconnect_prisma():
    """Disconnect from the database"""
    try:
        await prisma.disconnect()
        logger.info("✅ Database disconnected successfully")
    except Exception as e:
        logger.error(f"❌ Database disconnection failed: {e}")
        # Don't raise for now
        # raise

async def get_prisma():
    """Get Prisma instance"""
    return prisma
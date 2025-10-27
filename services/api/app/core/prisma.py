from app.generated.prisma import Prisma
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

prisma = Prisma()

async def connect_prisma():
    """Connect to the database"""
    try:
        if not await prisma.is_connected():
            await prisma.connect()
        logger.info("✅ Database connected successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # Don't raise to allow app to start without DB
        return False

async def disconnect_prisma():
    """Disconnect from the database"""
    try:
        if await prisma.is_connected():
            await prisma.disconnect()
            logger.info("✅ Database disconnected successfully")
    except Exception as e:
        logger.error(f"❌ Database disconnection failed: {e}")

async def get_prisma():
    """Get Prisma instance"""
    return prisma

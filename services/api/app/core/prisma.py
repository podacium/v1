import os
os.environ['PRISMA_USE_PYTHON_ENGINE'] = '1'
os.environ['PRISMA_PY_BINARY_CACHE_DIR'] = '/tmp'

from app.generated.prisma import Prisma
from app.core.config import settings
import logging
import os
import logging
from app.generated.prisma import Prisma
from app.core.config import settings

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
        if not await prisma.is_connected():
            await prisma.connect()
        logger.info("✅ Database connected successfully (Python engine)")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # Don't raise to allow app to start without DB
        return False

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

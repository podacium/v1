import os
import logging
from app.generated.prisma import Prisma
from app.core.config import settings

logger = logging.getLogger(__name__)

# ✅ Only set these in Render environment
if os.environ.get("RENDER", "false").lower() == "true":
    os.environ["PRISMA_USE_PYTHON_ENGINE"] = "1"
    os.environ["PRISMA_PY_BINARY_CACHE_DIR"] = "/tmp"

# Initialize Prisma client
prisma = Prisma()

async def connect_prisma():
    """Connect to the database"""
    try:
        await prisma.connect()
        logger.info("✅ Database connected successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # Attempt a second connection using Python engine
        try:
            await prisma.connect()
            logger.info("✅ Database reconnected using Python engine")
            return True
        except Exception as inner_e:
            logger.error(f"❌ Second attempt failed: {inner_e}")
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

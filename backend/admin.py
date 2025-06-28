"""
Admin Interface - Disabled for Supabase SDK
"""
import logging

logger = logging.getLogger(__name__)

def create_admin(app) -> None:
    """Admin interface is disabled when using Supabase SDK"""
    logger.info("⚠️  Admin interface disabled - using Supabase SDK")
    logger.info("🔗 Use Supabase Dashboard for admin operations: https://supabase.com/dashboard")
    return None 
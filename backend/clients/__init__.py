"""
Clients package for external API integrations
"""
import logging
from typing import Optional
from .dify_client import DifyClient
from .s3_client import S3Client

logger = logging.getLogger(__name__)

# Global client instances
resume_parser_client: Optional[DifyClient] = None
s3_client: Optional[S3Client] = None

def initialize_clients():
    """Initialize global client instances with configuration"""
    global resume_parser_client, s3_client
    
    # Import config here to avoid circular imports
    from config import (
        DIFY_RESUME_PARSE_API_KEY, 
        DIFY_API_BASE_URL,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY, 
        AWS_REGION,
        S3_BUCKET_NAME
    )
    
    # Initialize resume parser client if configured
    if DIFY_RESUME_PARSE_API_KEY:
        try:
            resume_parser_client = DifyClient(
                api_key=DIFY_RESUME_PARSE_API_KEY,
                base_url=DIFY_API_BASE_URL
            )
            logger.info("✅ Resume parser client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize resume parser client: {e}")
            resume_parser_client = None
    else:
        logger.warning("⚠️ Resume parser client not initialized - DIFY_RESUME_PARSE_API_KEY not configured")
    
    # Initialize S3 client if configured
    if all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME]):
        try:
            s3_client = S3Client(
                access_key_id=AWS_ACCESS_KEY_ID,
                secret_access_key=AWS_SECRET_ACCESS_KEY,
                region=AWS_REGION,
                bucket_name=S3_BUCKET_NAME
            )
            logger.info("✅ S3 client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize S3 client: {e}")
            s3_client = None
    else:
        logger.warning("⚠️ S3 client not initialized - AWS credentials not configured")

def get_dify_resume_parser_client() -> Optional[DifyClient]:
    """Get the global Dify resume parser client instance"""
    if resume_parser_client is None:
        logger.error("Dify resume parser client is not initialized")
    return resume_parser_client

def get_s3_client() -> Optional[S3Client]:
    """Get the global S3 client instance"""
    if s3_client is None:
        logger.error("S3 client is not initialized")
    return s3_client

# Initialize clients when module is imported
try:
    initialize_clients()
except Exception as e:
    logger.error(f"Failed to initialize clients during import: {e}") 
"""
File upload controller
Handles file upload API endpoints
"""
import logging
from fastapi import APIRouter, UploadFile, File
from botocore.exceptions import ClientError

from clients import get_s3_client
from .utils import create_error_response

logger = logging.getLogger(__name__)


# Create router for upload-related endpoints
upload_router = APIRouter(prefix="", tags=["upload"])


@upload_router.post("/upload", operation_id="upload_file")
async def upload_file_endpoint(file: UploadFile = File(...)):
    """
    Upload file to S3 bucket.
    Returns the file URL and metadata.
    """
    logger.info("POST /upload - filename=%s, content_type=%s", file.filename, file.content_type)
    
    # Get the global S3 client instance
    s3_client = get_s3_client()
    if not s3_client:
        return create_error_response(
            status_code=503,
            detail="File upload service is not configured. AWS S3 credentials are missing.",
            code="S3_SERVICE_NOT_CONFIGURED"
        )
    
    # Check file size (limit to 10MB)
    max_file_size = 10 * 1024 * 1024  # 10MB
    if file.size and file.size > max_file_size:
        return create_error_response(
            status_code=413,
            detail=f"File too large. Maximum size is {max_file_size // (1024*1024)}MB",
            code="FILE_TOO_LARGE"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload file to S3
        result = await s3_client.upload_file(
            file_content=file_content,
            file_name=file.filename,
            folder="uploads",
            content_type=file.content_type
        )
        
        return result
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        logger.error(f"S3 upload failed with error code {error_code}: {e}")
        
        if error_code == 'AccessDenied':
            return create_error_response(
                status_code=403,
                detail="Access denied to S3 bucket",
                code="S3_ACCESS_DENIED"
            )
        else:
            return create_error_response(
                status_code=500,
                detail=f"S3 upload failed: {e}",
                code=f"S3_UPLOAD_ERROR_{error_code}"
            )
    except Exception as e:
        logger.error(f"Unexpected error in file upload: {str(e)}")
        return create_error_response(
            status_code=500,
            detail=f"Internal server error: {str(e)}",
            code="INTERNAL_SERVER_ERROR"
        ) 
"""
Resume parsing service
Handles business logic for resume parsing using Dify API
"""
import logging
from typing import Dict, Any, AsyncGenerator
import httpx

from clients import get_dify_resume_parser_client
from clients.dify_client import DifyChatRequest, DifyFileObject
from .exceptions import ServiceUnavailableException, ResumeParseException, ExternalAPIException

logger = logging.getLogger(__name__)

async def parse_resume_from_url(file_url: str) -> AsyncGenerator[str, None]:
    """
    Parse resume from file URL using Dify API (streaming mode)
    
    Args:
        file_url: URL of the resume file to parse
        
    Yields:
        Streaming response chunks from Dify API
        
    Raises:
        ServiceUnavailableException: If Dify client is not configured
        ExternalAPIException: If Dify API call fails  
        ResumeParseException: If resume parsing fails
    """
    logger.info(f"Starting streaming resume parsing for file: {file_url}")
    
    # Get the Dify resume parser client
    dify_client = get_dify_resume_parser_client()
    if not dify_client:
        logger.error("Dify resume parser client is not available")
        raise ServiceUnavailableException(
            "Resume parsing service is not configured. DIFY_RESUME_PARSE_API_KEY is missing.",
            "DIFY_CLIENT_NOT_CONFIGURED"
        )
    
    try:
        # Create file object for the request
        # Define supported file extensions
        document_extensions = (
            '.txt', '.md', '.mdx', '.markdown', '.pdf', '.html', 
            '.xlsx', '.xls', '.doc', '.docx', '.csv', '.eml', 
            '.msg', '.pptx', '.ppt', '.xml', '.epub'
        )
        image_extensions = (
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
        )
        
        # Determine file type based on extension
        file_extension = file_url.lower().split('.')[-1] if '.' in file_url else ''
        file_extension_with_dot = f'.{file_extension}'
        
        if file_extension_with_dot in document_extensions:
            file_type = "document"
        elif file_extension_with_dot in image_extensions:
            file_type = "image"
        else:
            # Default to document for unknown types
            raise ResumeParseException(
                f"Unsupported file type: {file_extension_with_dot}",
                "UNSUPPORTED_FILE_TYPE"
            )
        
        file_obj = DifyFileObject(
            type=file_type,
            transfer_method="remote_url",
            url=file_url
        )
        
        # Create chat request for resume parsing (streaming mode)
        chat_request = DifyChatRequest(
            query="Please analyze and parse this resume file.",
            inputs={
                "uploaded_file": file_obj
            },
            response_mode="streaming",
            user="resume_parser",
            auto_generate_name=True
        )
        
        # Send streaming request to Dify API
        logger.info(f"Sending streaming parse request to Dify API for: {file_url}")
        
        async for chunk in dify_client.send_chat_message_stream(chat_request):
            yield chunk
            
        logger.info(f"Streaming resume parsing completed for: {file_url}")
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Dify API HTTP error: {e.response.status_code}")
        raise ExternalAPIException(
            f"Dify API HTTP error: {e.response.status_code}",
            api_name="dify",
            status_code=e.response.status_code,
            error_code="DIFY_HTTP_ERROR"
        )
    except httpx.RequestError as e:
        logger.error(f"Dify API request error: {str(e)}")
        raise ExternalAPIException(
            f"Failed to connect to Dify API: {str(e)}",
            api_name="dify",
            status_code=None,
            error_code="DIFY_CONNECTION_ERROR"
        )
    except Exception as e:
        logger.error(f"Error during streaming resume parsing for {file_url}: {str(e)}")
        # Generic parsing error
        raise ResumeParseException(
            f"Failed to parse resume: {str(e)}",
            "RESUME_PARSE_ERROR"
        ) 
"""
Resume parsing controller
Handles resume parsing API endpoints
"""
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.resume_parse_service import parse_resume_from_url
from services.exceptions import ServiceUnavailableException, ResumeParseException, ExternalAPIException
from .utils import create_error_response

logger = logging.getLogger(__name__)


class ResumeParseRequest(BaseModel):
    file_url: str = Field(..., description="URL of the file to parse")


# Create router for resume-related endpoints
resume_router = APIRouter(prefix="", tags=["resume"])


@resume_router.post("/resume-parse", operation_id="parse_resume")
async def parse_resume_endpoint(request: ResumeParseRequest):
    """
    Parse resume from file URL using Dify API (streaming mode).
    Returns real-time streaming response for better user experience.
    """
    logger.info("POST /resume-parse - file_url=%s", request.file_url)
    
    try:
        # Try to get the first chunk - if this fails, return JSON error
        stream_generator = parse_resume_from_url(request.file_url)
        first_chunk = await stream_generator.__anext__()
        
        # If we successfully got the first chunk, start streaming response
        async def generate_stream():
            # Yield the first chunk we already got
            yield first_chunk
            
            # Then yield the rest of the chunks
            try:
                async for chunk in stream_generator:
                    yield chunk
            except Exception as e:
                # Log the error but don't yield error data in stream
                logger.error(f"Error during streaming: {str(e)}")
                # Simply end the stream
                return
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except ServiceUnavailableException as e:
        logger.error(f"Service unavailable: {e.message}")
        return create_error_response(
            status_code=503,
            detail=e.message,
            code=e.error_code
        )
    except ExternalAPIException as e:
        logger.error(f"External API error: {e.message}")
        status_code = 502 if e.status_code else 500
        return create_error_response(
            status_code=status_code,
            detail=f"External service error: {e.message}",
            code=e.error_code
        )
    except ResumeParseException as e:
        logger.error(f"Resume parsing error: {e.message}")
        return create_error_response(
            status_code=422,
            detail=e.message,
            code=e.error_code
        )
    except Exception as e:
        logger.error(f"Failed to start resume parsing: {str(e)}")
        return create_error_response(
            status_code=500,
            detail=f"Internal server error: {str(e)}",
            code="INTERNAL_SERVER_ERROR"
        ) 
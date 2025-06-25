"""
Middleware configurations for the FastAPI application
"""
from fastapi import Request
from fastapi.responses import Response
import logging

logger = logging.getLogger(__name__)

# CORS configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000"
]


def is_origin_allowed(origin: str) -> bool:
    """Check if the origin is allowed for CORS"""
    if not origin:
        return False
    
    # Check localhost origins
    if origin in ALLOWED_ORIGINS:
        return True
    
    # Allow all Vercel domains (both .vercel.app and custom domains)
    if origin.startswith("https://") and ".vercel.app" in origin:
        return True
    
    return False


def set_cors_headers(response: Response, origin: str) -> None:
    """Set CORS headers on the response"""
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"


async def custom_cors_middleware(request: Request, call_next):
    """Custom CORS middleware to handle dynamic Vercel URLs"""
    origin = request.headers.get("origin")
    allowed = is_origin_allowed(origin)
    
    # Handle preflight requests
    if request.method == "OPTIONS":
        response = Response()
        if allowed and origin:
            set_cors_headers(response, origin)
        return response
    
    response = await call_next(request)
    
    if allowed and origin:
        set_cors_headers(response, origin)
    
    return response


async def https_redirect_middleware(request: Request, call_next):
    """Middleware to handle HTTPS behind proxy (AWS App Runner)"""
    # Check if we're behind a proxy that handles HTTPS
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto == "https":
        # Tell the app it's HTTPS even though the internal connection is HTTP
        request.scope["scheme"] = "https"
    
    response = await call_next(request)
    return response
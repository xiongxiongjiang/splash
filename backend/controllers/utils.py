"""
Controller utilities
Common functions shared across controllers
"""
from fastapi.responses import JSONResponse


def create_error_response(status_code: int, detail: str, code: str = None):
    """Create a standardized error response with detail and optional code"""
    error_data = {"detail": detail}
    if code:
        error_data["code"] = code
    return JSONResponse(
        status_code=status_code,
        content=error_data
    ) 
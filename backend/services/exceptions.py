"""
Service layer exceptions
Business logic exceptions that should be handled by the controller layer
"""


class ServiceException(Exception):
    """Base exception for service layer"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class ServiceUnavailableException(ServiceException):
    """Raised when a required service is not available or not configured"""
    pass


class ResumeParseException(ServiceException):
    """Raised when resume parsing fails"""
    pass


class ExternalAPIException(ServiceException):
    """Raised when external API call fails"""
    def __init__(self, message: str, api_name: str, status_code: int = None, error_code: str = None):
        self.api_name = api_name
        self.status_code = status_code
        super().__init__(message, error_code) 
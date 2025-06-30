"""
Dify API client for chat completion
Provides configurable client class to interact with Dify's chat API
"""
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Pydantic models for Dify API
class DifyFileObject(BaseModel):
    type: str = Field(..., description="File type: document, image, audio, video, custom")
    transfer_method: str = Field(..., description="Transfer method: remote_url or local_file")
    url: Optional[str] = Field(None, description="Image URL for remote_url method")
    upload_file_id: Optional[str] = Field(None, description="Upload file ID for local_file method")

class DifyChatRequest(BaseModel):
    query: str = Field(..., description="User input/question content")
    inputs: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Variable values defined by the App")
    response_mode: str = Field(default="streaming", description="Response mode: streaming or blocking")
    user: str = Field(..., description="User identifier for retrieval and statistics")
    conversation_id: Optional[str] = Field(None, description="Conversation ID to continue previous chat")
    files: Optional[List[DifyFileObject]] = Field(None, description="File list for multimodal input")
    auto_generate_name: Optional[bool] = Field(True, description="Auto-generate conversation title")



class DifyClient:
    """Configurable client for interacting with Dify API"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.dify.ai/v1"):
        """
        Initialize Dify client with API key and base URL
        
        Args:
            api_key: Dify API key
            base_url: Dify API base URL (default: https://api.dify.ai/v1)
        """
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def send_chat_message(self, request: DifyChatRequest) -> Dict[str, Any]:
        """Send a chat message to Dify API"""
        url = f"{self.base_url}/chat-messages"
        
        # Use the response_mode from the request
        request_data = request.model_dump(exclude_none=True)
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=request_data
                )
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Dify API HTTP error: {e.response.status_code}")
                raise e
            except httpx.RequestError as e:
                logger.error(f"Dify API request error: {str(e)}")
                raise e
            except Exception as e:
                logger.error(f"Unexpected error calling Dify API: {str(e)}")
                raise e
    
    async def send_chat_message_stream(self, request: DifyChatRequest) -> AsyncGenerator[str, None]:
        """Send a chat message to Dify API (streaming mode)"""
        url = f"{self.base_url}/chat-messages"
        
        # Use the response_mode from the request
        request_data = request.model_dump(exclude_none=True)
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                async with client.stream(
                    "POST",
                    url,
                    headers=self.headers,
                    json=request_data
                ) as response:
                    response.raise_for_status()
                    
                    async for chunk in response.aiter_bytes():
                        # Direct proxy - return raw bytes as-is from Dify API
                        yield chunk.decode('utf-8')
                                        
            except httpx.HTTPStatusError as e:
                # For streaming responses, we can't access response.text directly
                logger.error(f"Dify API HTTP error: {e.response.status_code}")
                raise e
                
            except httpx.RequestError as e:
                logger.error(f"Dify API request error: {str(e)}")
                raise e
                
            except Exception as e:
                logger.error(f"Unexpected error calling Dify API: {str(e)}")
                raise e
    
 
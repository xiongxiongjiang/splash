"""
Klaviyo Integration Module
Production-ready FastAPI integration with Klaviyo for profile creation and list subscription
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env.local in development FIRST
load_dotenv(".env.local")

import logging
from typing import Optional
import httpx
from fastapi import HTTPException
from pydantic import BaseModel, EmailStr

# Setup logging
logger = logging.getLogger(__name__)

# Configuration
KLAVIYO_BASE_URL = "https://a.klaviyo.com"
KLAVIYO_LIST_ID = "SBZMFk"
KLAVIYO_API_REVISION = "2024-10-15"

# Get API key from environment
KLAVIYO_PRIVATE_KEY = os.getenv("KLAVIYO_PRIVATE_KEY")


# Pydantic models
class KlaviyoSubscribeRequest(BaseModel):
    """Request model for subscribing to Klaviyo"""
    email: EmailStr
    first_name: str
    last_name: str


class KlaviyoSubscribeResponse(BaseModel):
    """Response model for Klaviyo subscription"""
    success: bool
    profile_id: str
    message: str


# Helper functions
async def create_klaviyo_profile(
    email: str,
    first_name: str,
    last_name: str,
    properties: dict,
    client: httpx.AsyncClient
) -> str:
    """
    Create a profile in Klaviyo with custom properties
    Returns the profile ID if successful
    """
    url = f"{KLAVIYO_BASE_URL}/api/profiles"
    
    headers = {
        "Authorization": f"Klaviyo-API-Key {KLAVIYO_PRIVATE_KEY}",
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION
    }
    
    # Build attributes with email and names
    attributes = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name
    }
    
    # Add custom properties if provided
    if properties:
        attributes["properties"] = properties
    
    payload = {
        "data": {
            "type": "profile",
            "attributes": attributes
        }
    }
    
    try:
        response = await client.post(url, json=payload, headers=headers, timeout=30.0)
        
        if response.status_code in [200, 201]:
            data = response.json()
            profile_id = data["data"]["id"]
            logger.info(f"Successfully created Klaviyo profile for {email} with ID: {profile_id}")
            return profile_id
        else:
            logger.error(f"Failed to create Klaviyo profile. Status: {response.status_code}, Response: {response.text}")
            raise Exception(f"Failed to create Klaviyo profile: Status {response.status_code}")
            
    except httpx.TimeoutException:
        logger.error(f"Timeout while creating Klaviyo profile for {email}")
        raise Exception("Request to Klaviyo timed out")
    except httpx.RequestError as e:
        logger.error(f"Network error while creating Klaviyo profile: {str(e)}")
        raise Exception(f"Network error: {str(e)}")


async def add_profile_to_list(
    profile_id: str,
    list_id: str,
    client: httpx.AsyncClient
) -> bool:
    """
    Add a profile to a Klaviyo list
    Returns True if successful
    """
    url = f"{KLAVIYO_BASE_URL}/api/lists/{list_id}/relationships/profiles"
    
    headers = {
        "Authorization": f"Klaviyo-API-Key {KLAVIYO_PRIVATE_KEY}",
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION
    }
    
    payload = {
        "data": [
            {
                "type": "profile",
                "id": profile_id
            }
        ]
    }
    
    try:
        response = await client.post(url, json=payload, headers=headers, timeout=30.0)
        
        if response.status_code in [200, 201, 204]:
            logger.info(f"Successfully added profile {profile_id} to list {list_id}")
            return True
        else:
            logger.error(f"Failed to add profile to list. Status: {response.status_code}, Response: {response.text}")
            raise Exception(f"Failed to add profile to list: Status {response.status_code}")
            
    except httpx.TimeoutException:
        logger.error(f"Timeout while adding profile {profile_id} to list")
        raise Exception("Request to Klaviyo timed out")
    except httpx.RequestError as e:
        logger.error(f"Network error while adding profile to list: {str(e)}")
        raise Exception(f"Network error: {str(e)}")


async def update_klaviyo_profile_properties(
    email: str,
    properties: dict,
    client: httpx.AsyncClient
) -> bool:
    """
    Update profile properties in Klaviyo by email
    Returns True if successful
    """
    # First, get the profile by email to get the profile ID
    url = f"{KLAVIYO_BASE_URL}/api/profiles"
    
    headers = {
        "Authorization": f"Klaviyo-API-Key {KLAVIYO_PRIVATE_KEY}",
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION
    }
    
    # Search for profile by email
    params = {"filter": f'equals(email,"{email}")'}
    
    try:
        # Get profile
        response = await client.get(url, headers=headers, params=params, timeout=30.0)
        
        if response.status_code == 200:
            data = response.json()
            if data["data"]:
                profile_id = data["data"][0]["id"]
                
                # Update profile properties
                update_url = f"{KLAVIYO_BASE_URL}/api/profiles/{profile_id}"
                
                # Get existing properties and merge with new ones
                existing_properties = data["data"][0]["attributes"].get("properties", {})
                merged_properties = {**existing_properties, **properties}
                
                update_payload = {
                    "data": {
                        "type": "profile",
                        "id": profile_id,
                        "attributes": {
                            "properties": merged_properties
                        }
                    }
                }
                
                update_response = await client.patch(update_url, json=update_payload, headers=headers, timeout=30.0)
                
                if update_response.status_code in [200, 201, 204]:
                    logger.info(f"Successfully updated Klaviyo profile properties for {email}")
                    return True
                else:
                    logger.error(f"Failed to update Klaviyo profile properties. Status: {update_response.status_code}, Response: {update_response.text}")
                    raise Exception(f"Failed to update profile properties: Status {update_response.status_code}")
            else:
                logger.warning(f"No Klaviyo profile found for email {email}")
                return False
        else:
            logger.error(f"Failed to find Klaviyo profile. Status: {response.status_code}, Response: {response.text}")
            raise Exception(f"Failed to find profile: Status {response.status_code}")
            
    except httpx.TimeoutException:
        logger.error(f"Timeout while updating Klaviyo profile properties for {email}")
        raise Exception("Request to Klaviyo timed out")
    except httpx.RequestError as e:
        logger.error(f"Network error while updating Klaviyo profile properties: {str(e)}")
        raise Exception(f"Network error: {str(e)}")


async def subscribe_to_klaviyo_from_waitlist(
    email: str,
    info: dict
) -> None:
    """
    Subscribe a waitlist user to Klaviyo
    Extracts first_name and last_name from info, uses defaults if not provided
    This is non-blocking - failures are logged but don't raise exceptions
    """
    # Check if API key is set
    if not KLAVIYO_PRIVATE_KEY:
        logger.warning("KLAVIYO_PRIVATE_KEY environment variable is not set - skipping Klaviyo subscription")
        return
    
    # Extract name from info or use defaults
    first_name = info.get("first_name", info.get("firstName", ""))
    last_name = info.get("last_name", info.get("lastName", ""))
    
    # If no names provided, try to parse from email
    if not first_name and not last_name:
        email_parts = email.split("@")[0].split(".")
        if len(email_parts) >= 2:
            first_name = email_parts[0].capitalize()
            last_name = email_parts[1].capitalize()
        else:
            first_name = email.split("@")[0].capitalize()
            last_name = ""
    
    # Prepare properties (exclude first_name and last_name as they're top-level attributes)
    properties = {k: v for k, v in info.items() if k not in ["first_name", "firstName", "last_name", "lastName"]}
    
    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Create profile with properties
            profile_id = await create_klaviyo_profile(
                email=email,
                first_name=first_name,
                last_name=last_name,
                properties=properties,
                client=client
            )
            
            # Step 2: Add profile to list
            await add_profile_to_list(
                profile_id=profile_id,
                list_id=KLAVIYO_LIST_ID,
                client=client
            )
            
            logger.info(f"Successfully subscribed {email} to Klaviyo list from waitlist")
            
        except Exception as e:
            # Log error but don't block the request
            logger.error(f"Failed to subscribe {email} to Klaviyo from waitlist: {str(e)}")


async def update_klaviyo_from_waitlist(
    email: str,
    updated_info: dict
) -> None:
    """
    Update Klaviyo profile properties when waitlist info is updated
    This is non-blocking - failures are logged but don't raise exceptions
    """
    # Check if API key is set
    if not KLAVIYO_PRIVATE_KEY:
        logger.warning("KLAVIYO_PRIVATE_KEY environment variable is not set - skipping Klaviyo property update")
        return
    
    # Prepare properties (exclude first_name and last_name as they're top-level attributes)
    properties = {k: v for k, v in updated_info.items() if k not in ["first_name", "firstName", "last_name", "lastName"]}
    
    if not properties:
        logger.info(f"No properties to update for {email} in Klaviyo")
        return
    
    async with httpx.AsyncClient() as client:
        try:
            await update_klaviyo_profile_properties(
                email=email,
                properties=properties,
                client=client
            )
            
            logger.info(f"Successfully updated Klaviyo profile properties for {email}")
            
        except Exception as e:
            # Log error but don't block the request
            logger.error(f"Failed to update Klaviyo profile properties for {email}: {str(e)}")


async def subscribe_to_klaviyo(
    subscribe_data: KlaviyoSubscribeRequest
) -> KlaviyoSubscribeResponse:
    """
    Main function to subscribe a user to Klaviyo
    This orchestrates the two-step process:
    1. Create profile
    2. Add profile to list
    
    Note: This is non-blocking - failures are logged but don't raise exceptions
    """
    # Check if API key is set
    if not KLAVIYO_PRIVATE_KEY:
        logger.warning("KLAVIYO_PRIVATE_KEY environment variable is not set - skipping Klaviyo subscription")
        return KlaviyoSubscribeResponse(
            success=False,
            profile_id="",
            message="Klaviyo integration not configured - subscription skipped"
        )
    
    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Create profile
            profile_id = await create_klaviyo_profile(
                email=subscribe_data.email,
                first_name=subscribe_data.first_name,
                last_name=subscribe_data.last_name,
                client=client
            )
            
            # Step 2: Add profile to list
            await add_profile_to_list(
                profile_id=profile_id,
                list_id=KLAVIYO_LIST_ID,
                client=client
            )
            
            logger.info(f"Successfully subscribed {subscribe_data.email} to Klaviyo list")
            
            return KlaviyoSubscribeResponse(
                success=True,
                profile_id=profile_id,
                message=f"Successfully subscribed {subscribe_data.email} to Klaviyo"
            )
            
        except Exception as e:
            # Log error but don't block the request
            logger.error(f"Failed to subscribe {subscribe_data.email} to Klaviyo: {str(e)}")
            return KlaviyoSubscribeResponse(
                success=False,
                profile_id="",
                message=f"Klaviyo subscription failed but request completed - error logged"
            )
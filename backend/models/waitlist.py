from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime


class WaitlistBase(BaseModel):
    email: EmailStr
    info: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Waitlist(WaitlistBase):
    model_config = ConfigDict(from_attributes=True)


class WaitlistCreate(BaseModel):
    email: EmailStr
    info: Optional[Dict[str, Any]] = None


class WaitlistUpdate(BaseModel):
    info: Dict[str, Any]


class WaitlistRead(Waitlist):
    pass
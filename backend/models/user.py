from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    role: str = "user"

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    supabase_id: str
    created_at: datetime
    last_seen: datetime

class UserCreate(UserBase):
    supabase_id: str

class UserRead(User):
    pass

class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None 
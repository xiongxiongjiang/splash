from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    role: str = Field(default="user")

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    supabase_id: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.now)
    last_seen: datetime = Field(default_factory=datetime.now)
    
    # Relationship to resumes
    resumes: List["Resume"] = Relationship(back_populates="user")

class UserCreate(UserBase):
    supabase_id: str

class UserRead(UserBase):
    id: int
    supabase_id: str
    created_at: datetime
    last_seen: datetime

class UserUpdate(SQLModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None 
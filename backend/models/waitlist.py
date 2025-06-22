from sqlmodel import Field, SQLModel, Column
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import EmailStr, ConfigDict
from sqlalchemy import func, JSON


class WaitlistBase(SQLModel):
    email: EmailStr = Field(primary_key=True, index=True)
    info: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)


class Waitlist(WaitlistBase, table=True):
    __tablename__ = "waitlist"


class WaitlistCreate(SQLModel):
    email: EmailStr
    info: Optional[Dict[str, Any]] = None


class WaitlistUpdate(SQLModel):
    info: Dict[str, Any]


class WaitlistRead(WaitlistBase):
    model_config = ConfigDict(from_attributes=True)
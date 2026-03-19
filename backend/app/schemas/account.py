from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints


AccountType = Literal["cash", "bank", "card", "ewallet", "liability"]
AccountName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class AccountBase(BaseModel):
    name: AccountName
    account_type: AccountType


class AccountCreate(AccountBase):
    is_active: bool = True


class AccountUpdate(BaseModel):
    name: AccountName | None = None
    account_type: AccountType | None = None
    is_active: bool | None = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    account_type: AccountType
    is_active: bool
    created_at: datetime
    updated_at: datetime

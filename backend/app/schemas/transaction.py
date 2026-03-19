from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


TransactionType = Literal["income", "expense"]
TransactionDescription = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=255),
]


class TransactionBase(BaseModel):
    occurred_at: datetime
    transaction_type: TransactionType
    account_id: int
    category_id: int | None = None
    amount: int = Field(ge=1)
    description: TransactionDescription | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    occurred_at: datetime | None = None
    transaction_type: TransactionType | None = None
    account_id: int | None = None
    category_id: int | None = None
    amount: int | None = Field(default=None, ge=1)
    description: TransactionDescription | None = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    occurred_at: datetime
    transaction_type: TransactionType
    account_id: int
    category_id: int | None
    amount: int
    description: str | None
    source_type: str
    import_batch_id: int | None
    dedupe_hash: str | None
    created_at: datetime
    updated_at: datetime

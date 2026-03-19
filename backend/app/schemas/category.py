from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints


CategoryType = Literal["income", "expense"]
CategoryName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class CategoryBase(BaseModel):
    name: CategoryName
    category_type: CategoryType
    parent_id: int | None = None


class CategoryCreate(CategoryBase):
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: CategoryName | None = None
    category_type: CategoryType | None = None
    parent_id: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category_type: CategoryType
    parent_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

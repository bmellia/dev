from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.session import require_admin_user
from app.db.session import get_db
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryType,
    CategoryUpdate,
)
from app.services.category_service import (
    create_category,
    get_category,
    get_category_by_name,
    list_categories,
    update_category,
)


router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    dependencies=[Depends(require_admin_user)],
)


@router.get("", response_model=list[CategoryResponse])
def read_categories(
    include_inactive: bool = Query(default=True),
    category_type: Annotated[CategoryType | None, Query()] = None,
    db: Session = Depends(get_db),
) -> list[CategoryResponse]:
    return list_categories(
        db,
        include_inactive=include_inactive,
        category_type=category_type,
    )


@router.get("/{category_id}", response_model=CategoryResponse)
def read_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    category = get_category(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    _validate_parent_category(db, payload.parent_id, payload.category_type)

    existing_category = get_category_by_name(
        db,
        payload.name.strip(),
        payload.category_type,
        payload.parent_id,
    )
    if existing_category is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    return create_category(db, payload)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category_endpoint(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    category = get_category(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    updated_fields = payload.model_fields_set
    next_category_type = payload.category_type or category.category_type
    next_parent_id = (
        payload.parent_id
        if "parent_id" in updated_fields
        else category.parent_id
    )

    if "parent_id" in updated_fields and payload.parent_id == category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category cannot be its own parent",
        )

    if "parent_id" in updated_fields:
        _validate_parent_category(db, payload.parent_id, next_category_type)

    if {"name", "category_type", "parent_id"} & updated_fields:
        existing_category = get_category_by_name(
            db,
            (payload.name or category.name).strip(),
            next_category_type,
            next_parent_id,
        )
        if existing_category is not None and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            )

    return update_category(db, category, payload)


@router.post("/{category_id}/deactivate", response_model=CategoryResponse)
def deactivate_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    category = get_category(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return update_category(db, category, CategoryUpdate(is_active=False))


def _validate_parent_category(
    db: Session,
    parent_id: int | None,
    category_type: CategoryType,
) -> None:
    if parent_id is None:
        return

    parent_category = get_category(db, parent_id)
    if parent_category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent category not found",
        )
    if parent_category.category_type != category_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent category type must match",
        )

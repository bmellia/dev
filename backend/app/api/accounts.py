from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.session import require_admin_user
from app.db.session import get_db
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account_service import (
    create_account,
    get_account,
    get_account_by_name,
    list_accounts,
    update_account,
)


router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
    dependencies=[Depends(require_admin_user)],
)


@router.get("", response_model=list[AccountResponse])
def read_accounts(
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[AccountResponse]:
    return list_accounts(db, include_inactive=include_inactive)


@router.get("/{account_id}", response_model=AccountResponse)
def read_account(
    account_id: int,
    db: Session = Depends(get_db),
) -> AccountResponse:
    account = get_account(db, account_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return account


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account_endpoint(
    payload: AccountCreate,
    db: Session = Depends(get_db),
) -> AccountResponse:
    existing_account = get_account_by_name(db, payload.name.strip())
    if existing_account is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account name already exists",
        )

    return create_account(db, payload)


@router.patch("/{account_id}", response_model=AccountResponse)
def update_account_endpoint(
    account_id: int,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
) -> AccountResponse:
    account = get_account(db, account_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if payload.name is not None:
        existing_account = get_account_by_name(db, payload.name.strip())
        if existing_account is not None and existing_account.id != account_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account name already exists",
            )

    return update_account(db, account, payload)


@router.post("/{account_id}/deactivate", response_model=AccountResponse)
def deactivate_account(
    account_id: int,
    db: Session = Depends(get_db),
) -> AccountResponse:
    account = get_account(db, account_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    return update_account(db, account, AccountUpdate(is_active=False))

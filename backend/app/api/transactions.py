from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.session import require_admin_user
from app.db.session import get_db
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_transaction,
    update_transaction,
)
from app.services.transaction_query_service import query_transactions


router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(require_admin_user)],
)


@router.get("", response_model=list[TransactionResponse])
def read_transactions(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    day: date | None = None,
    account_id: int | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:
    try:
        return query_transactions(
            db,
            month=month,
            day=day,
            account_id=account_id,
            category_id=category_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/{transaction_id}", response_model=TransactionResponse)
def read_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction_endpoint(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    _validate_transaction_relations(
        db=db,
        account_id=payload.account_id,
        category_id=payload.category_id,
        transaction_type=payload.transaction_type,
    )
    return create_transaction(db, payload)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction_endpoint(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    updated_fields = payload.model_fields_set
    next_transaction_type = payload.transaction_type or transaction.transaction_type
    next_account_id = payload.account_id or transaction.account_id
    next_category_id = (
        payload.category_id
        if "category_id" in updated_fields
        else transaction.category_id
    )

    _validate_transaction_relations(
        db=db,
        account_id=next_account_id,
        category_id=next_category_id,
        transaction_type=next_transaction_type,
    )
    return update_transaction(db, transaction, payload)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db),
) -> Response:
    transaction = get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    delete_transaction(db, transaction)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _validate_transaction_relations(
    db: Session,
    account_id: int,
    category_id: int | None,
    transaction_type: str,
) -> None:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if category_id is None:
        return

    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    if category.category_type != transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category type must match transaction type",
        )

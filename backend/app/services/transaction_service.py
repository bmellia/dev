from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def list_transactions(db: Session) -> list[Transaction]:
    statement: Select[tuple[Transaction]] = select(Transaction).order_by(
        Transaction.occurred_at.desc(),
        Transaction.id.desc(),
    )
    return list(db.scalars(statement).all())


def get_transaction(db: Session, transaction_id: int) -> Transaction | None:
    return db.get(Transaction, transaction_id)


def create_transaction(db: Session, payload: TransactionCreate) -> Transaction:
    transaction = Transaction(
        occurred_at=payload.occurred_at,
        transaction_type=payload.transaction_type,
        account_id=payload.account_id,
        category_id=payload.category_id,
        amount=payload.amount,
        description=payload.description,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def update_transaction(
    db: Session,
    transaction: Transaction,
    payload: TransactionUpdate,
) -> Transaction:
    updated_fields = payload.model_fields_set

    if payload.occurred_at is not None:
        transaction.occurred_at = payload.occurred_at
    if payload.transaction_type is not None:
        transaction.transaction_type = payload.transaction_type
    if payload.account_id is not None:
        transaction.account_id = payload.account_id
    if "category_id" in updated_fields:
        transaction.category_id = payload.category_id
    if payload.amount is not None:
        transaction.amount = payload.amount
    if "description" in updated_fields:
        transaction.description = payload.description

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: Transaction) -> None:
    db.delete(transaction)
    db.commit()

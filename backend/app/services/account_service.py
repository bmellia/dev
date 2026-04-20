from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate


def list_accounts(
    db: Session,
    admin_user_id: int,
    include_inactive: bool = True,
) -> list[Account]:
    statement: Select[tuple[Account]] = (
        select(Account)
        .where(Account.admin_user_id == admin_user_id)
        .order_by(Account.id.asc())
    )
    if not include_inactive:
        statement = statement.where(Account.is_active.is_(True))
    return list(db.scalars(statement).all())


def get_account(db: Session, account_id: int, admin_user_id: int) -> Account | None:
    statement = select(Account).where(
        Account.id == account_id,
        Account.admin_user_id == admin_user_id,
    )
    return db.scalar(statement)


def get_account_by_name(db: Session, admin_user_id: int, name: str) -> Account | None:
    statement = select(Account).where(
        Account.admin_user_id == admin_user_id,
        Account.name == name,
    )
    return db.scalar(statement)


def create_account(db: Session, admin_user_id: int, payload: AccountCreate) -> Account:
    account = Account(
        admin_user_id=admin_user_id,
        name=payload.name.strip(),
        account_type=payload.account_type,
        is_active=payload.is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update_account(db: Session, account: Account, payload: AccountUpdate) -> Account:
    if payload.name is not None:
        account.name = payload.name.strip()
    if payload.account_type is not None:
        account.account_type = payload.account_type
    if payload.is_active is not None:
        account.is_active = payload.is_active

    db.add(account)
    db.commit()
    db.refresh(account)
    return account

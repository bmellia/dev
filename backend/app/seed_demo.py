from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.bootstrap import bootstrap
from app.db.session import SessionLocal
from app.models import Account, AdminUser, Category, Transaction
from app.services.auth_service import get_admin_by_username


def seed_demo_data() -> None:
    bootstrap()
    db = SessionLocal()
    try:
        existing_transaction = db.scalar(select(Transaction.id).limit(1))
        if existing_transaction is not None:
            print("Demo seed skipped: existing transactions found.")
            return

        admin_user = get_admin_by_username(db, "admin")
        if admin_user is None:
            raise RuntimeError("Bootstrap admin user not found")

        accounts = {
            "국민은행": _get_or_create_account(db, admin_user, "국민은행", "bank"),
            "현금지갑": _get_or_create_account(db, admin_user, "현금지갑", "cash"),
            "생활비카드": _get_or_create_account(db, admin_user, "생활비카드", "card"),
        }

        categories = {
            "급여": _get_or_create_category(db, admin_user, "급여", "income"),
            "식비": _get_or_create_category(db, admin_user, "식비", "expense"),
            "교통": _get_or_create_category(db, admin_user, "교통", "expense"),
            "쇼핑": _get_or_create_category(db, admin_user, "쇼핑", "expense"),
        }

        now = datetime.now().replace(minute=0, second=0, microsecond=0)
        samples = [
            ("income", accounts["국민은행"].id, categories["급여"].id, 3200000, "월급 입금", now - timedelta(days=12)),
            ("expense", accounts["생활비카드"].id, categories["식비"].id, 18500, "점심 식사", now - timedelta(days=3)),
            ("expense", accounts["생활비카드"].id, categories["교통"].id, 1450, "버스", now - timedelta(days=2)),
            ("expense", accounts["현금지갑"].id, categories["쇼핑"].id, 32000, "생활용품", now - timedelta(days=1)),
            ("expense", accounts["국민은행"].id, categories["식비"].id, 64000, "주말 장보기", now),
        ]

        for transaction_type, account_id, category_id, amount, description, occurred_at in samples:
            db.add(
                Transaction(
                    admin_user_id=admin_user.id,
                    occurred_at=occurred_at,
                    transaction_type=transaction_type,
                    account_id=account_id,
                    category_id=category_id,
                    amount=amount,
                    description=description,
                ),
            )

        db.commit()
        print("Demo seed completed.")
    finally:
        db.close()


def _get_or_create_account(
    db: Session,
    admin_user: AdminUser,
    name: str,
    account_type: str,
) -> Account:
    account = db.scalar(
        select(Account).where(
            Account.admin_user_id == admin_user.id,
            Account.name == name,
        ),
    )
    if account is not None:
        return account

    account = Account(
        admin_user_id=admin_user.id,
        name=name,
        account_type=account_type,
        is_active=True,
    )
    db.add(account)
    db.flush()
    return account


def _get_or_create_category(
    db: Session,
    admin_user: AdminUser,
    name: str,
    category_type: str,
) -> Category:
    category = db.scalar(
        select(Category).where(
            Category.admin_user_id == admin_user.id,
            Category.name == name,
            Category.category_type == category_type,
        ),
    )
    if category is not None:
        return category

    category = Category(
        admin_user_id=admin_user.id,
        name=name,
        category_type=category_type,
        is_active=True,
    )
    db.add(category)
    db.flush()
    return category


if __name__ == "__main__":
    seed_demo_data()

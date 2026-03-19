from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.transaction import Transaction


def get_monthly_summary(db: Session, month: str) -> dict[str, int]:
    start_at, end_at = _resolve_month_range(month)

    income_case = case(
        (Transaction.transaction_type == "income", Transaction.amount),
        else_=0,
    )
    expense_case = case(
        (Transaction.transaction_type == "expense", Transaction.amount),
        else_=0,
    )

    statement = select(
        func.coalesce(func.sum(income_case), 0),
        func.coalesce(func.sum(expense_case), 0),
    ).where(
        Transaction.occurred_at >= start_at,
        Transaction.occurred_at < end_at,
    )

    income_total, expense_total = db.execute(statement).one()
    return {
        "income_total": int(income_total),
        "expense_total": int(expense_total),
        "net_total": int(income_total) - int(expense_total),
    }


def get_account_summaries(db: Session) -> list[dict[str, int | str | bool]]:
    signed_amount = case(
        (Transaction.transaction_type == "income", Transaction.amount),
        else_=-Transaction.amount,
    )

    statement = (
        select(
            Account.id,
            Account.name,
            Account.account_type,
            Account.is_active,
            func.coalesce(func.sum(signed_amount), 0).label("balance"),
        )
        .outerjoin(Transaction, Transaction.account_id == Account.id)
        .group_by(
            Account.id,
            Account.name,
            Account.account_type,
            Account.is_active,
        )
        .order_by(Account.id.asc())
    )

    rows = db.execute(statement).all()
    return [
        {
            "account_id": row.id,
            "name": row.name,
            "account_type": row.account_type,
            "is_active": row.is_active,
            "balance": int(row.balance),
        }
        for row in rows
    ]


def _resolve_month_range(month: str) -> tuple[datetime, datetime]:
    year_str, month_str = month.split("-", maxsplit=1)
    year = int(year_str)
    month_value = int(month_str)

    start_at = datetime(year, month_value, 1)
    if month_value == 12:
        end_at = datetime(year + 1, 1, 1)
    else:
        end_at = datetime(year, month_value + 1, 1)
    return start_at, end_at

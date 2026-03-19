from datetime import date, datetime, time, timedelta

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def query_transactions(
    db: Session,
    *,
    month: str | None = None,
    day: date | None = None,
    account_id: int | None = None,
    category_id: int | None = None,
) -> list[Transaction]:
    statement: Select[tuple[Transaction]] = select(Transaction)

    start_at, end_at = _resolve_date_range(month=month, day=day)
    if start_at is not None and end_at is not None:
        statement = statement.where(
            Transaction.occurred_at >= start_at,
            Transaction.occurred_at < end_at,
        )

    if account_id is not None:
        statement = statement.where(Transaction.account_id == account_id)
    if category_id is not None:
        statement = statement.where(Transaction.category_id == category_id)

    statement = statement.order_by(
        Transaction.occurred_at.desc(),
        Transaction.id.desc(),
    )
    return list(db.scalars(statement).all())


def _resolve_date_range(
    *,
    month: str | None,
    day: date | None,
) -> tuple[datetime | None, datetime | None]:
    if month is not None and day is not None:
        raise ValueError("month and day filters cannot be used together")

    if day is not None:
        start_at = datetime.combine(day, time.min)
        end_at = start_at + timedelta(days=1)
        return start_at, end_at

    if month is None:
        return None, None

    year_str, month_str = month.split("-", maxsplit=1)
    year = int(year_str)
    month_value = int(month_str)

    start_at = datetime(year, month_value, 1)
    if month_value == 12:
        end_at = datetime(year + 1, 1, 1)
    else:
        end_at = datetime(year, month_value + 1, 1)
    return start_at, end_at

import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction


def export_transactions_csv(db: Session, admin_user_id: int) -> str:
    statement = (
        select(
            Transaction.occurred_at,
            Transaction.transaction_type,
            Account.name.label("account_name"),
            Category.name.label("category_name"),
            Transaction.amount,
            Transaction.description,
            Transaction.source_type,
            Transaction.import_batch_id,
            Transaction.dedupe_hash,
        )
        .join(Account, Account.id == Transaction.account_id)
        .outerjoin(Category, Category.id == Transaction.category_id)
        .where(Transaction.admin_user_id == admin_user_id)
        .order_by(Transaction.occurred_at.asc(), Transaction.id.asc())
    )

    rows = db.execute(statement).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "date",
            "transaction_type",
            "account",
            "category",
            "amount",
            "description",
            "source_type",
            "import_batch_id",
            "dedupe_hash",
        ]
    )

    for row in rows:
        writer.writerow(
            [
                row.occurred_at.date().isoformat(),
                row.transaction_type,
                row.account_name,
                row.category_name or "",
                row.amount,
                row.description or "",
                row.source_type,
                row.import_batch_id or "",
                row.dedupe_hash or "",
            ]
        )

    return buffer.getvalue()

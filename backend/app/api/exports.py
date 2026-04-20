from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.session import require_admin_user
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.services.export_service import export_transactions_csv


router = APIRouter(
    prefix="/exports",
    tags=["exports"],
    dependencies=[Depends(require_admin_user)],
)


@router.get("/transactions.csv")
def export_transactions(
    db: Session = Depends(get_db),
    admin_user: AdminUser = Depends(require_admin_user),
) -> Response:
    csv_content = export_transactions_csv(db, admin_user.id)
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="transactions.csv"',
        },
    )

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.session import require_admin_user
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.services.dashboard_service import get_account_summaries, get_monthly_summary


router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_admin_user)],
)


class MonthlySummaryResponse(BaseModel):
    month: str
    income_total: int
    expense_total: int
    net_total: int


class AccountSummaryResponse(BaseModel):
    account_id: int
    name: str
    account_type: str
    is_active: bool
    balance: int


@router.get("/summary", response_model=MonthlySummaryResponse)
def read_monthly_summary(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    admin_user: AdminUser = Depends(require_admin_user),
) -> MonthlySummaryResponse:
    try:
        summary = get_monthly_summary(db, admin_user.id, month)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return MonthlySummaryResponse(month=month, **summary)


@router.get("/accounts", response_model=list[AccountSummaryResponse])
def read_account_summaries(
    db: Session = Depends(get_db),
    admin_user: AdminUser = Depends(require_admin_user),
) -> list[AccountSummaryResponse]:
    return [
        AccountSummaryResponse(**row)
        for row in get_account_summaries(db, admin_user.id)
    ]

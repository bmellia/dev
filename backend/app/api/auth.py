from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.session import (
    clear_session_cookie,
    get_session_expires_at,
    load_session_payload,
    require_admin_user,
    set_session_cookie,
)
from app.core.config import settings
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.services.auth_service import authenticate_admin, change_admin_password


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminSessionResponse(BaseModel):
    id: int
    username: str
    expires_at: datetime


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


@router.post("/login", response_model=AdminSessionResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AdminSessionResponse:
    admin_user = authenticate_admin(db, payload.username, payload.password)
    if admin_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    set_session_cookie(response, admin_user.id)
    return AdminSessionResponse(
        id=admin_user.id,
        username=admin_user.username,
        expires_at=get_session_expires_at(datetime.now(timezone.utc)),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response)
    return response


@router.get("/me", response_model=AdminSessionResponse)
def me(
    request: Request,
    admin_user=Depends(require_admin_user),
) -> AdminSessionResponse:
    cookie_value = request.cookies.get(settings.session_cookie_name)
    expires_at = datetime.now(timezone.utc)
    if cookie_value:
        session_payload = load_session_payload(cookie_value)
        if session_payload is not None:
            _payload, issued_at = session_payload
            expires_at = get_session_expires_at(issued_at)

    return AdminSessionResponse(
        id=admin_user.id,
        username=admin_user.username,
        expires_at=expires_at,
    )


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    admin_user=Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> Response:
    stored_admin_user = db.get(AdminUser, admin_user.id)
    if stored_admin_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found",
        )

    if not change_admin_password(
        db,
        stored_admin_user,
        payload.current_password,
        payload.new_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)

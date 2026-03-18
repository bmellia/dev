from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.session import clear_session_cookie, require_admin_user, set_session_cookie
from app.db.session import get_db
from app.services.auth_service import authenticate_admin


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminSessionResponse(BaseModel):
    id: int
    username: str


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
    return AdminSessionResponse(id=admin_user.id, username=admin_user.username)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response)
    return response


@router.get("/me", response_model=AdminSessionResponse)
def me(
    admin_user=Depends(require_admin_user),
) -> AdminSessionResponse:
    return AdminSessionResponse(id=admin_user.id, username=admin_user.username)

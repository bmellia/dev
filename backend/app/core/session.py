from itsdangerous import BadSignature, URLSafeSerializer
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.admin_user import AdminUser


def _get_serializer() -> URLSafeSerializer:
    return URLSafeSerializer(settings.session_secret_key, salt="admin-session")


def set_session_cookie(response: Response, admin_user_id: int) -> None:
    serializer = _get_serializer()
    cookie_value = serializer.dumps({"admin_user_id": admin_user_id})
    response.set_cookie(
        key=settings.session_cookie_name,
        value=cookie_value,
        max_age=settings.session_cookie_max_age,
        httponly=True,
        samesite=settings.session_cookie_samesite,
        secure=settings.session_cookie_secure,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        samesite=settings.session_cookie_samesite,
        secure=settings.session_cookie_secure,
        path="/",
    )


def get_current_admin_user(
    request: Request,
    db: Session = Depends(get_db),
) -> AdminUser | None:
    cookie_value = request.cookies.get(settings.session_cookie_name)
    if not cookie_value:
        return None

    serializer = _get_serializer()
    try:
        payload = serializer.loads(cookie_value)
    except BadSignature:
        return None

    admin_user_id = payload.get("admin_user_id")
    if admin_user_id is None:
        return None

    return db.get(AdminUser, admin_user_id)


def require_admin_user(
    admin_user: AdminUser | None = Depends(get_current_admin_user),
) -> AdminUser:
    if admin_user is None or not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return admin_user

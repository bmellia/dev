from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.admin_user import AdminUser


def get_admin_by_username(db: Session, username: str) -> AdminUser | None:
    statement = select(AdminUser).where(AdminUser.username == username)
    return db.scalar(statement)


def create_admin_user(db: Session, username: str, password: str) -> AdminUser:
    admin_user = AdminUser(
        username=username,
        password_hash=get_password_hash(password),
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user


def authenticate_admin(db: Session, username: str, password: str) -> AdminUser | None:
    admin_user = get_admin_by_username(db, username)
    if admin_user is None or not admin_user.is_active:
        return None

    if not verify_password(password, admin_user.password_hash):
        return None

    return admin_user


def change_admin_password(
    db: Session,
    admin_user: AdminUser,
    current_password: str,
    new_password: str,
) -> bool:
    if not verify_password(current_password, admin_user.password_hash):
        return False

    admin_user.password_hash = get_password_hash(new_password)
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return True

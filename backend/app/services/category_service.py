from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def list_categories(
    db: Session,
    include_inactive: bool = True,
    category_type: str | None = None,
) -> list[Category]:
    statement: Select[tuple[Category]] = select(Category).order_by(
        Category.id.asc(),
    )
    if not include_inactive:
        statement = statement.where(Category.is_active.is_(True))
    if category_type is not None:
        statement = statement.where(Category.category_type == category_type)
    return list(db.scalars(statement).all())


def get_category(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def get_category_by_name(
    db: Session,
    name: str,
    category_type: str,
    parent_id: int | None,
) -> Category | None:
    statement = select(Category).where(
        Category.name == name,
        Category.category_type == category_type,
        Category.parent_id == parent_id,
    )
    return db.scalar(statement)


def create_category(db: Session, payload: CategoryCreate) -> Category:
    category = Category(
        name=payload.name.strip(),
        category_type=payload.category_type,
        parent_id=payload.parent_id,
        is_active=payload.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    category: Category,
    payload: CategoryUpdate,
) -> Category:
    updated_fields = payload.model_fields_set

    if payload.name is not None:
        category.name = payload.name.strip()
    if payload.category_type is not None:
        category.category_type = payload.category_type
    if "parent_id" in updated_fields:
        category.parent_id = payload.parent_id
    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.add(category)
    db.commit()
    db.refresh(category)
    return category

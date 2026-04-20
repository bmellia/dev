import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.session import _get_serializer, require_admin_user
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Account, AdminUser, Category, Transaction
from app.services.auth_service import create_admin_user


ADMIN_PASSWORD = "*12344321*"


class ApiEndpointsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(
            bind=cls.engine,
            autoflush=False,
            autocommit=False,
        )

        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[require_admin_user] = lambda: SimpleNamespace(
            id=1,
            username="admin",
            is_active=True,
        )

    @classmethod
    def tearDownClass(cls) -> None:
        app.dependency_overrides.clear()
        cls.engine.dispose()

    def setUp(self) -> None:
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self._seed_admin_user()
        self.client = TestClient(app)
        self._set_current_user(1, "admin")

    def tearDown(self) -> None:
        self.client.close()

    def test_accounts_crud_flow(self) -> None:
        create_response = self.client.post(
            "/accounts",
            json={"name": "Checking", "account_type": "bank"},
        )
        self.assertEqual(create_response.status_code, 201)
        account = create_response.json()
        self.assertEqual(account["name"], "Checking")
        self.assertTrue(account["is_active"])

        list_response = self.client.get("/accounts")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

        update_response = self.client.patch(
            f"/accounts/{account['id']}",
            json={"name": "Main Checking", "is_active": False},
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["name"], "Main Checking")
        self.assertFalse(update_response.json()["is_active"])

        filtered_response = self.client.get("/accounts", params={"include_inactive": "false"})
        self.assertEqual(filtered_response.status_code, 200)
        self.assertEqual(filtered_response.json(), [])

    def test_categories_parent_validation(self) -> None:
        parent_response = self.client.post(
            "/categories",
            json={
                "name": "Food",
                "category_type": "expense",
            },
        )
        self.assertEqual(parent_response.status_code, 201)
        parent = parent_response.json()

        child_response = self.client.post(
            "/categories",
            json={
                "name": "Dining",
                "category_type": "expense",
                "parent_id": parent["id"],
            },
        )
        self.assertEqual(child_response.status_code, 201)
        self.assertEqual(child_response.json()["parent_id"], parent["id"])

        invalid_response = self.client.post(
            "/categories",
            json={
                "name": "Salary Child",
                "category_type": "income",
                "parent_id": parent["id"],
            },
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertEqual(
            invalid_response.json()["detail"],
            "Parent category type must match",
        )

    def test_transactions_queries_dashboard_and_delete(self) -> None:
        account_id = self._create_account("Wallet", "cash")
        income_category_id = self._create_category("Salary", "income")
        expense_category_id = self._create_category("Groceries", "expense")

        income_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-18T09:00:00",
                "transaction_type": "income",
                "account_id": account_id,
                "category_id": income_category_id,
                "amount": 500000,
                "description": "March salary",
            },
        )
        self.assertEqual(income_response.status_code, 201)
        income_tx = income_response.json()

        expense_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-18T12:00:00",
                "transaction_type": "expense",
                "account_id": account_id,
                "category_id": expense_category_id,
                "amount": 12000,
                "description": "Lunch",
            },
        )
        self.assertEqual(expense_response.status_code, 201)
        expense_tx = expense_response.json()

        month_response = self.client.get("/transactions", params={"month": "2026-03"})
        self.assertEqual(month_response.status_code, 200)
        self.assertEqual(len(month_response.json()), 2)

        day_response = self.client.get("/transactions", params={"day": "2026-03-18"})
        self.assertEqual(day_response.status_code, 200)
        self.assertEqual(len(day_response.json()), 2)

        summary_response = self.client.get(
            "/dashboard/summary",
            params={"month": "2026-03"},
        )
        self.assertEqual(summary_response.status_code, 200)
        self.assertEqual(
            summary_response.json(),
            {
                "month": "2026-03",
                "income_total": 500000,
                "expense_total": 12000,
                "net_total": 488000,
            },
        )

        account_summary_response = self.client.get("/dashboard/accounts")
        self.assertEqual(account_summary_response.status_code, 200)
        self.assertEqual(account_summary_response.json()[0]["balance"], 488000)

        mismatch_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-18T13:00:00",
                "transaction_type": "expense",
                "account_id": account_id,
                "category_id": income_category_id,
                "amount": 1,
            },
        )
        self.assertEqual(mismatch_response.status_code, 400)

        patch_response = self.client.patch(
            f"/transactions/{expense_tx['id']}",
            json={"amount": 15000, "description": "Late lunch"},
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["amount"], 15000)

        delete_response = self.client.delete(f"/transactions/{income_tx['id']}")
        self.assertEqual(delete_response.status_code, 204)

        final_list_response = self.client.get("/transactions", params={"month": "2026-03"})
        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(len(final_list_response.json()), 1)

    def test_transactions_csv_export(self) -> None:
        account_id = self._create_account("Card", "card")
        category_id = self._create_category("Transport", "expense")

        create_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-01T08:30:00",
                "transaction_type": "expense",
                "account_id": account_id,
                "category_id": category_id,
                "amount": 1400,
                "description": "Bus",
            },
        )
        self.assertEqual(create_response.status_code, 201)

        export_response = self.client.get("/exports/transactions.csv")
        self.assertEqual(export_response.status_code, 200)
        self.assertIn("text/csv", export_response.headers["content-type"])
        self.assertIn("date,transaction_type,account,category,amount", export_response.text)
        self.assertIn("2026-03-01,expense,Card,Transport,1400,Bus,manual,,", export_response.text)

    def test_user_data_is_scoped_per_login(self) -> None:
        self._create_second_admin_user()

        primary_account_id = self._create_account("Wallet", "cash")
        primary_category_id = self._create_category("Food", "expense")
        primary_transaction_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-18T09:00:00",
                "transaction_type": "expense",
                "account_id": primary_account_id,
                "category_id": primary_category_id,
                "amount": 12000,
                "description": "admin expense",
            },
        )
        self.assertEqual(primary_transaction_response.status_code, 201)

        self._set_current_user(2, "second")
        second_account_id = self._create_account("Wallet", "cash")
        second_category_id = self._create_category("Food", "expense")
        second_transaction_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-19T09:00:00",
                "transaction_type": "expense",
                "account_id": second_account_id,
                "category_id": second_category_id,
                "amount": 24000,
                "description": "second expense",
            },
        )
        self.assertEqual(second_transaction_response.status_code, 201)

        self._set_current_user(1, "admin")
        accounts_response = self.client.get("/accounts")
        self.assertEqual(accounts_response.status_code, 200)
        self.assertEqual(len(accounts_response.json()), 1)
        self.assertEqual(accounts_response.json()[0]["id"], primary_account_id)

        transactions_response = self.client.get("/transactions", params={"month": "2026-03"})
        self.assertEqual(transactions_response.status_code, 200)
        self.assertEqual(len(transactions_response.json()), 1)
        self.assertEqual(transactions_response.json()[0]["description"], "admin expense")

        summary_response = self.client.get("/dashboard/summary", params={"month": "2026-03"})
        self.assertEqual(summary_response.status_code, 200)
        self.assertEqual(summary_response.json()["expense_total"], 12000)

        export_response = self.client.get("/exports/transactions.csv")
        self.assertEqual(export_response.status_code, 200)
        self.assertIn("admin expense", export_response.text)
        self.assertNotIn("second expense", export_response.text)

        account_response = self.client.get(f"/accounts/{second_account_id}")
        self.assertEqual(account_response.status_code, 404)

        invalid_transaction_response = self.client.post(
            "/transactions",
            json={
                "occurred_at": "2026-03-20T09:00:00",
                "transaction_type": "expense",
                "account_id": second_account_id,
                "category_id": second_category_id,
                "amount": 5000,
                "description": "cross user access",
            },
        )
        self.assertEqual(invalid_transaction_response.status_code, 404)

    def test_change_password(self) -> None:
        change_response = self.client.post(
            "/auth/change-password",
            json={
                "current_password": ADMIN_PASSWORD,
                "new_password": "nextpass1234",
            },
        )
        self.assertEqual(change_response.status_code, 204)

        failed_login_response = self.client.post(
            "/auth/login",
            json={"username": "admin", "password": ADMIN_PASSWORD},
        )
        self.assertEqual(failed_login_response.status_code, 401)

        success_login_response = self.client.post(
            "/auth/login",
            json={"username": "admin", "password": "nextpass1234"},
        )
        self.assertEqual(success_login_response.status_code, 200)
        self.assertEqual(success_login_response.json()["username"], "admin")
        self.assertIn("expires_at", success_login_response.json())

    def test_auth_session_expires_after_max_age(self) -> None:
        app.dependency_overrides.pop(require_admin_user, None)
        original_max_age = settings.session_cookie_max_age

        try:
            login_response = self.client.post(
                "/auth/login",
                json={"username": "admin", "password": ADMIN_PASSWORD},
            )
            self.assertEqual(login_response.status_code, 200)
            self.assertIn("Max-Age=1200", login_response.headers["set-cookie"])

            serializer = _get_serializer()
            expired_cookie = serializer.dumps({"admin_user_id": 1})
            settings.session_cookie_max_age = -1

            self.client.cookies.set(
                settings.session_cookie_name,
                expired_cookie,
            )

            me_response = self.client.get("/auth/me")
            self.assertEqual(me_response.status_code, 401)
        finally:
            settings.session_cookie_max_age = original_max_age
            app.dependency_overrides[require_admin_user] = lambda: SimpleNamespace(
                id=1,
                username="admin",
                is_active=True,
            )

    def test_auth_me_returns_session_expiration(self) -> None:
        app.dependency_overrides.pop(require_admin_user, None)

        try:
            login_response = self.client.post(
                "/auth/login",
                json={"username": "admin", "password": ADMIN_PASSWORD},
            )
            self.assertEqual(login_response.status_code, 200)

            me_response = self.client.get("/auth/me")
            self.assertEqual(me_response.status_code, 200)
            self.assertEqual(me_response.json()["username"], "admin")
            self.assertIn("expires_at", me_response.json())
        finally:
            app.dependency_overrides[require_admin_user] = lambda: SimpleNamespace(
                id=1,
                username="admin",
                is_active=True,
            )

    def _create_account(self, name: str, account_type: str) -> int:
        response = self.client.post(
            "/accounts",
            json={"name": name, "account_type": account_type},
        )
        self.assertEqual(response.status_code, 201)
        return response.json()["id"]

    def _create_category(self, name: str, category_type: str) -> int:
        response = self.client.post(
            "/categories",
            json={"name": name, "category_type": category_type},
        )
        self.assertEqual(response.status_code, 201)
        return response.json()["id"]

    def _seed_admin_user(self) -> None:
        db = self.SessionLocal()
        try:
            create_admin_user(db, "admin", ADMIN_PASSWORD)
        finally:
            db.close()

    def _create_second_admin_user(self) -> None:
        db = self.SessionLocal()
        try:
            create_admin_user(db, "second", "second1234")
        finally:
            db.close()

    def _set_current_user(self, user_id: int, username: str) -> None:
        app.dependency_overrides[require_admin_user] = lambda: SimpleNamespace(
            id=user_id,
            username=username,
            is_active=True,
        )


if __name__ == "__main__":
    unittest.main()

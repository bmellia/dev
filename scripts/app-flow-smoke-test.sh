#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="/data/dev"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"
PROJECT_NAME="dev-appflow"

compose() {
  BACKEND_HOST_PORT=18000 FRONTEND_HOST_PORT=13000 MARIADB_HOST_PORT=13306 \
    docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" "$@"
}

cleanup() {
  compose down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[INFO] Starting compose stack for app-flow smoke test"
compose up --build -d

echo "[INFO] Waiting for services"
sleep 5

echo "[INFO] Compose status"
compose ps

echo "[INFO] Running end-to-end API flow from backend container"
compose exec -T backend python - <<'PY'
import csv
import io
import json
import time
import urllib.error
import urllib.request
from http.cookies import SimpleCookie

BASE_URL = "http://127.0.0.1:8000"


def wait_for_health() -> None:
    for attempt in range(1, 21):
        try:
            with urllib.request.urlopen(f"{BASE_URL}/health", timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if payload["status"] != "ok":
                    raise RuntimeError(payload)
                print("[PY] health ok", payload)
                return
        except urllib.error.URLError:
            if attempt == 20:
                raise
            time.sleep(1)


def request_json(path: str, *, method: str = "GET", data: dict | None = None, headers: dict | None = None, cookie: str | None = None):
    body = None
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    if cookie:
        request_headers["Cookie"] = cookie

    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        headers=request_headers,
        method=method,
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        raw_body = response.read().decode("utf-8")
        return response.status, response.headers, json.loads(raw_body) if raw_body else None


def request_text(path: str, *, cookie: str) -> tuple[int, str]:
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        headers={"Cookie": cookie},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return response.status, response.read().decode("utf-8")


wait_for_health()

status, headers, body = request_json(
    "/auth/login",
    method="POST",
    data={"username": "admin", "password": "*12344321*"},
)
assert status == 200, status
assert body["username"] == "admin", body
set_cookie = headers.get("Set-Cookie")
assert set_cookie, headers
cookie = SimpleCookie()
cookie.load(set_cookie)
session_cookie = "; ".join(f"{key}={morsel.value}" for key, morsel in cookie.items())
assert session_cookie, set_cookie
print("[PY] login ok", body)

status, _, account = request_json(
    "/accounts",
    method="POST",
    data={"name": "스모크통장", "account_type": "bank"},
    cookie=session_cookie,
)
assert status == 201, status
print("[PY] account created", account)

status, _, category = request_json(
    "/categories",
    method="POST",
    data={"name": "스모크식비", "category_type": "expense"},
    cookie=session_cookie,
)
assert status == 201, status
print("[PY] category created", category)

status, _, transaction = request_json(
    "/transactions",
    method="POST",
    data={
        "occurred_at": "2026-03-19T12:30:00",
        "transaction_type": "expense",
        "account_id": account["id"],
        "category_id": category["id"],
        "amount": 15000,
        "description": "스모크 테스트 점심",
    },
    cookie=session_cookie,
)
assert status == 201, status
print("[PY] transaction created", transaction)

status, _, transactions = request_json(
    "/transactions?month=2026-03",
    cookie=session_cookie,
)
assert status == 200, status
assert any(item["id"] == transaction["id"] for item in transactions), transactions
print("[PY] transaction list ok", len(transactions))

status, _, summary = request_json(
    "/dashboard/summary?month=2026-03",
    cookie=session_cookie,
)
assert status == 200, status
assert summary["expense_total"] >= 15000, summary
print("[PY] dashboard summary ok", summary)

status, csv_text = request_text(
    "/exports/transactions.csv",
    cookie=session_cookie,
)
assert status == 200, status
rows = list(csv.DictReader(io.StringIO(csv_text)))
assert any(row["description"] == "스모크 테스트 점심" for row in rows), rows
print("[PY] csv export ok", len(rows))
PY

echo "[INFO] Frontend HTML check from frontend container"
compose exec -T frontend node -e '
fetch("http://127.0.0.1:3000")
  .then((response) => response.text())
  .then((html) => {
    if (!html.includes("<div id=\"root\"></div>")) {
      throw new Error("root container not found");
    }
    console.log("frontend html ok");
  });
'

echo "[INFO] Backend recent logs"
compose logs backend --tail=20

echo "[INFO] Frontend recent logs"
compose logs frontend --tail=20

echo "[OK] App-flow smoke test completed"

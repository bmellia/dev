#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="/data/dev"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"
PROJECT_NAME="dev-smoke"

compose() {
  docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" "$@"
}

cleanup() {
  compose down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[INFO] Starting compose stack"
compose up --build -d

echo "[INFO] Waiting for services"
sleep 5

echo "[INFO] Compose status"
compose ps

echo "[INFO] Backend health check from backend container"
compose exec -T backend python - <<'PY'
import json
import time
import urllib.request
import urllib.error

for attempt in range(1, 21):
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            assert payload["status"] == "ok", payload
            print(payload)
            break
    except urllib.error.URLError:
        if attempt == 20:
            raise
        time.sleep(1)
PY

echo "[INFO] Backend login check from backend container"
compose exec -T backend python - <<'PY'
import json
import time
import urllib.request
import urllib.error

payload = json.dumps({
    "username": "admin",
    "password": "*12344321*",
}).encode("utf-8")
for attempt in range(1, 21):
    request = urllib.request.Request(
        "http://127.0.0.1:8000/auth/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
            assert body["username"] == "admin", body
            print(body)
            break
    except urllib.error.URLError:
        if attempt == 20:
            raise
        time.sleep(1)
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

echo "[OK] Compose smoke test completed"

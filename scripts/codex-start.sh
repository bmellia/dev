#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="/data/dev"
LOG_DIR="/data/log"
TODAY="$(date +%F)"
NOW="$(date '+%F %T')"
DAILY_LOG="${LOG_DIR}/${TODAY}-job.log"
LATEST_LINK="${LOG_DIR}/latest-job.log"

mkdir -p "${LOG_DIR}"

touch "${DAILY_LOG}"
ln -sfn "${DAILY_LOG}" "${LATEST_LINK}"

append_start_log() {
  cat >> "${DAILY_LOG}" <<EOF
[${NOW}] TASK_START
Task: Codex session start
Objective: Initialize or resume Codex work session
Repo: ${REPO_ROOT}
Branch: $(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo "unknown")

Files Changed:
- none

Commands Run:
- mkdir -p ${LOG_DIR}
- touch ${DAILY_LOG}
- ln -sfn ${DAILY_LOG} ${LATEST_LINK}

Result:
- Daily log prepared
- latest-job.log updated

Pending:
- Resume previous Codex session or start a new one

Risks / Notes:
- This entry records session bootstrap only
- Detailed task logs should be appended during actual work

Next Step:
- Launch Codex and restore context from latest-job.log and git state

[${NOW}] TASK_END

EOF
}

show_context_hint() {
  echo "== Codex startup context =="
  echo "Repo      : ${REPO_ROOT}"
  echo "Daily log : ${DAILY_LOG}"
  echo "Latest    : ${LATEST_LINK}"
  echo "Date      : ${TODAY}"
  echo
  if [[ -f "${LATEST_LINK}" ]]; then
    echo "== Last 40 lines of latest-job.log =="
    tail -n 40 "${LATEST_LINK}" || true
    echo
  fi
  echo "== Git status =="
  git -C "${REPO_ROOT}" status --short || true
  echo
  echo "== Recent commits =="
  git -C "${REPO_ROOT}" log --oneline -n 5 || true
  echo
}

main() {
  cd "${REPO_ROOT}"

  append_start_log
  show_context_hint

  if codex resume --last >/dev/null 2>&1; then
    echo "[INFO] Opening last Codex session..."
    exec codex resume --last
  else
    echo "[INFO] No resumable recent session found. Starting new Codex session..."
    exec codex
  fi
}

main "$@"

#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="/data/dev"
LOG_DIR="/data/log"
TODAY="$(date +%F)"
START_TS="$(date '+%F %T')"
END_TS="$(date '+%F %T')"
DAILY_LOG="${LOG_DIR}/${TODAY}-job.log"
LATEST_LINK="${LOG_DIR}/latest-job.log"

TASK=""
OBJECTIVE=""
RESULT=""
PENDING=""
RISKS=""
NEXT_STEP=""
COMMANDS=""
FILES_CHANGED=""
BRANCH="$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo "unknown")"

usage() {
  cat <<'EOF'
Usage:
  codex-log-append.sh \
    --task "..." \
    --objective "..." \
    --result "..." \
    --pending "..." \
    --risks "..." \
    --next-step "..." \
    --commands "cmd1; cmd2; cmd3" \
    --files "file1 file2 file3"

Notes:
  - commands are split by semicolon (;)
  - files are split by whitespace
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)
      TASK="${2:-}"; shift 2 ;;
    --objective)
      OBJECTIVE="${2:-}"; shift 2 ;;
    --result)
      RESULT="${2:-}"; shift 2 ;;
    --pending)
      PENDING="${2:-}"; shift 2 ;;
    --risks)
      RISKS="${2:-}"; shift 2 ;;
    --next-step)
      NEXT_STEP="${2:-}"; shift 2 ;;
    --commands)
      COMMANDS="${2:-}"; shift 2 ;;
    --files)
      FILES_CHANGED="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "[ERROR] Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

mkdir -p "${LOG_DIR}"
touch "${DAILY_LOG}"
ln -sfn "${DAILY_LOG}" "${LATEST_LINK}"

format_list_from_semicolon() {
  local input="${1:-}"
  if [[ -z "${input}" ]]; then
    echo "- none"
    return
  fi
  IFS=';' read -r -a arr <<< "${input}"
  for item in "${arr[@]}"; do
    item="$(echo "${item}" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -n "${item}" ]] && echo "- ${item}"
  done
}

format_list_from_space() {
  local input="${1:-}"
  if [[ -z "${input}" ]]; then
    echo "- none"
    return
  fi
  for item in ${input}; do
    echo "- ${item}"
  done
}

cat >> "${DAILY_LOG}" <<EOF
[${START_TS}] TASK_START
Task: ${TASK:-unspecified}
Objective: ${OBJECTIVE:-unspecified}
Repo: ${REPO_ROOT}
Branch: ${BRANCH}

Files Changed:
$(format_list_from_space "${FILES_CHANGED}")

Commands Run:
$(format_list_from_semicolon "${COMMANDS}")

Result:
- ${RESULT:-unspecified}

Pending:
- ${PENDING:-none}

Risks / Notes:
- ${RISKS:-none}

Next Step:
- ${NEXT_STEP:-none}

[${END_TS}] TASK_END

EOF

echo "[OK] Appended log entry to ${DAILY_LOG}"
echo "[OK] latest-job.log -> ${DAILY_LOG}"

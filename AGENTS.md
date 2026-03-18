# AGENTS.md

## Role
You are the primary coding agent for this repository, operating through Codex CLI.

Your job is to:
- understand the current repository state
- restore prior context before starting work
- make safe, minimal, testable changes
- leave restart-friendly logs for future sessions

---

## Repository assumptions
- Repository root: `/data/dev`
- Operational log directory: `/data/log`
- Latest session pointer: `/data/log/latest-job.log`
- Daily log format: `/data/log/YYYY-MM-DD-job.log`

---

## Product context Before implementing major features, read /data/dev/docs/prd.md. 

Use /data/dev/docs/prd.md as the source of truth for: 
- MVP scope 
- screen structure 
- data model 
- CSV policy 
- implementation priority

---

## Language and reporting rules
- All user-facing summaries, progress updates, and final explanations must be written in Korean.
- Code, filenames, API paths, SQL, config keys, and commit messages may remain in English when appropriate.
- When work is completed, provide:
  1. a short Korean summary,
  2. changed files,
  3. next recommended step.
- If the user writes in Korean, respond in Korean unless explicitly asked otherwise.


## Mandatory startup procedure
Before making any code or configuration change, do the following in order:

1. Check whether `/data/log/latest-job.log` exists.
2. If it exists, read it first and summarize:
   - last completed work
   - unfinished work
   - known issues
   - next recommended step
3. If it does not exist, inspect:
   - `git status`
   - `git branch -vv`
   - `git log --oneline -n 10`
4. If both log and git context are unclear, ask for clarification before making risky changes.
5. Before large edits, create or recommend a git checkpoint commit.

---

## Mandatory work rules
- Prefer minimal, surgical changes over broad rewrites.
- Preserve existing user changes unless explicitly asked to replace them.
- Never delete log files unless explicitly requested.
- Never overwrite unrelated files.
- Always inspect current file contents before modifying them.
- Prefer reproducible shell commands.
- Prefer explicit paths in commands.
- Keep changes restart-friendly and operationally clear.

---

## Logging rules
For every meaningful task, append a structured entry to the daily log file:

- Path: `/data/log/YYYY-MM-DD-job.log`
- Also maintain/update symlink: `/data/log/latest-job.log`

Each log entry must include:
- timestamp
- task title
- objective
- repo path
- current branch
- files changed
- commands run
- result
- pending work
- risks / notes
- next step

If no code changes were made, still record:
- what was inspected
- what was decided
- why no changes were applied

---

## Mandatory end-of-task procedure
At the end of each meaningful task:

1. Run or report:
   - `git status`
   - relevant test/build/check commands if applicable
2. Summarize what changed.
3. Append the structured task entry to the current daily log file.
4. Make sure `/data/log/latest-job.log` points to the newest daily log file.
5. Report any pending actions and known risks.

---

## Git safety rules
Before risky or multi-file changes:
- inspect `git status`
- inspect `git diff` if the worktree is dirty
- create or recommend a checkpoint commit

After changes:
- summarize modified files
- show concise diff summary
- mention whether tests/checks were run

---

## Context recovery priority
When resuming work, use this priority:

1. Resume the previous Codex session if available:
   - `codex resume --last`
2. Read `/data/log/latest-job.log`
3. Read git state:
   - `git status`
   - `git branch -vv`
   - `git log --oneline -n 10`
4. Then continue implementation

---

## Output style
When starting a resumed task, begin with a short operational summary:

- Previous work:
- Current status:
- Next action:

Keep summaries concise and technical.

---

## Shell and path discipline
- Use `bash`-compatible commands.
- Use absolute paths where ambiguity is possible.
- Assume logs live outside the repo under `/data/log`.
- Do not assume helper scripts exist; verify before use.

---

## Logging template requirement
Use the exact structure below for each appended log entry:

[YYYY-MM-DD HH:MM:SS] TASK_START
Task: ...
Objective: ...
Repo: /data/dev
Branch: ...

Files Changed:
- ...

Commands Run:
- ...

Result:
- ...

Pending:
- ...

Risks / Notes:
- ...

Next Step:
- ...

[YYYY-MM-DD HH:MM:SS] TASK_END

#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./ralph.sh /path/to/project  <max_iterations>
# Example:
#   ./ralph.sh ~/code/my-app 20

PROJECT_DIR="${1:-.}"
MAX_ITERATIONS="${2:-10}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"

PRD_JSON="$PROJECT_DIR/prd.json"
PROGRESS_DIR="$PROJECT_DIR/progress"

echo "🚀 Starting Ralph loop"
echo "📁 Project: $PROJECT_DIR"
echo "🧠 Prompt:  $PROMPT_FILE"
echo "📋 PRD:     $PRD_JSON"
echo "📂 Progress dir: $PROGRESS_DIR"
echo "🔁 Max iterations: $MAX_ITERATIONS"

if ! command -v jq &> /dev/null; then
  echo "❌ jq is required but not installed"
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "❌ Missing prompt file: $PROMPT_FILE"
  exit 1
fi

if [[ ! -f "$PRD_JSON" ]]; then
  echo "❌ Missing PRD JSON in project: $PRD_JSON"
  exit 1
fi

# Ensure progress directory exists
mkdir -p "$PROGRESS_DIR"
cd "$PROJECT_DIR"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "════════════════════════════════"
  echo "Iteration $i / $MAX_ITERATIONS"
  echo "════════════════════════════════"

  # Find first task with passes: false (check subtasks first, then top-level tasks)
  CURRENT_TASK_ID=$(jq -r '
    (.[] | .subtasks[]? | select(.passes == false) | .id) //
    (.[] | select(.passes == false) | .id) //
    empty
  ' "$PRD_JSON" | head -1)

  if [[ -z "$CURRENT_TASK_ID" ]]; then
    echo "✅ All tasks completed — exiting."
    exit 0
  fi

  PROGRESS_LOG="$PROGRESS_DIR/${CURRENT_TASK_ID}.md"
  touch "$PROGRESS_LOG"
  echo "📋 Working on: $CURRENT_TASK_ID"
  echo "📘 Progress:   $PROGRESS_LOG"

  # Build run prompt to feed Claude Code
  ITER_PROMPT="$(cat "$PROMPT_FILE")

---
State files:
- @prd.json
- @progress/${CURRENT_TASK_ID}.md

Rules:
1) Load prd.json (tasks with statuses).
2) Load progress/${CURRENT_TASK_ID}.md (append-only log for this task).
3) Work on task: ${CURRENT_TASK_ID}
4) Implement that task and run relevant checks (tests/typecheck/lint).
5) Commit changes with: feat: [${CURRENT_TASK_ID}] - [Title]
6) Update prd.json for that task: set 'passes' to true.
7) Append learnings to progress/${CURRENT_TASK_ID}.md.
8) Stop after one task.
If all tasks have passed, include: <promise>COMPLETE</promise>"

echo "🤖 Claude starting at $(date)"

# Run Claude Code in fresh instance
claude --permission-mode acceptEdits -p "$ITER_PROMPT" \
  2>&1 | tee /dev/stderr &
CLAUDE_PID=$!

while kill -0 "$CLAUDE_PID" 2>/dev/null; do
  echo "⏳ Claude still working... $(date)"
  sleep 10
done

echo "✅ Claude finished at $(date)"


  # Durable stop check (based on prd.json contents)
  if ! grep -q '"passes"[[:space:]]*:[[:space:]]*false' "$PRD_JSON"; then
    echo "✅ All tasks completed — exiting."
    exit 0
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
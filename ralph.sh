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
PROGRESS_LOG="$PROJECT_DIR/progress.txt"

echo "🚀 Starting Ralph loop"
echo "📁 Project: $PROJECT_DIR"
echo "🧠 Prompt:  $PROMPT_FILE"
echo "📋 PRD:     $PRD_JSON"
echo "📘 Log:     $PROGRESS_LOG"
echo "🔁 Max iterations: $MAX_ITERATIONS"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "❌ Missing prompt file: $PROMPT_FILE"
  exit 1
fi

if [[ ! -f "$PRD_JSON" ]]; then
  echo "❌ Missing PRD JSON in project: $PRD_JSON"
  exit 1
fi

# Ensure progress file exists
touch "$PROGRESS_LOG"
cd "$PROJECT_DIR"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "════════════════════════════════"
  echo "Iteration $i / $MAX_ITERATIONS"
  echo "════════════════════════════════"

  # Build run prompt to feed Claude Code
  ITER_PROMPT="$(cat "$PROMPT_FILE")

---
State files:
- @prd.json
- @progress.txt

Rules:
1) Load prd.json (tasks with statuses).
2) Load progress.txt (append-only log).
3) Pick exactly ONE task where `passes: false` (highest priority).
4) Implement that task and run relevant checks (tests/typecheck/lint).
5) Commit changes with: feat: [ID] - [Title]
6) Update prd.json for that task: set `passes` to true.
7) Append learnings to progress.txt.
8) Stop after one task.
If all tasks have passed, include: <promise>COMPLETE</promise>"

  # Run Claude Code in fresh instance
  RESULT="$(claude --permission-mode acceptEdits -p "$ITER_PROMPT" 2>&1 | tee /dev/stderr)" || true

  # Durable stop check (based on prd.json contents)
  if ! grep -q '"passes"[[:space:]]*:[[:space:]]*false' "$PRD_JSON"; then
    echo "✅ All tasks completed — exiting."
    exit 0
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
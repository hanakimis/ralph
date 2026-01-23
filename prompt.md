# Ralph Agent Instructions

## Your Task

1. Read `prd.json`
2. Read `progress.txt`
3. Pick the highest-priority story where `"passes": false`
4. Implement that ONE story
5. Run typecheck and tests
6. Update `prd.json`:
   - Set `"passes": true` for the finished story
7. Append learnings to `progress.txt`
8. Commit with message: `feat: [ID] - [Title]`

## Progress Format (append to progress.txt)

## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered

## Stop Condition

If all stories have `"passes": true`, output:
<promise>COMPLETE</promise>
---
name: implement
description: "Slash command /implement <plan-file>: implement a checked plan after explicit user approval, verify the changes, teach relevant concepts, and update MEMORY.md."
argument-hint: '"docs/plans/plan-file.md"'
user-invocable: true
disable-model-invocation: true
---

# Implement an approved development plan

Use this skill when the user invokes `/implement "path/to/plan.md"`. This is stage four and the only stage that implements application changes.

## Approval and prerequisites

1. Obtain the plan path. If it is missing, ask the user.
2. Require the plan at `docs/plans/` to have status `Checked — awaiting user approval` (or a later implementation status) and a completed `Plan check` section. If not, stop and ask the user to run `/check` first.
3. The user's explicit `/implement "<plan path>"` invocation after `/check` is approval of that checked plan. If the user raises a concern or asks for a change instead, do not implement; return the plan to `/check`.
4. Read `MEMORY.md`, the complete plan, current Git status, and applicable source, tests, and repository instructions before editing. Preserve unrelated user changes. For Laravel work, obey Laravel-specific project rules and activate relevant Laravel skills.
5. If the plan has gone stale, conflicts with repository instructions, or requires a materially different scope, stop and use `/check` to revise it. Do not silently exceed the approved scope.

## Implementation procedure

1. Follow the checked plan in small, reviewable increments. Before a meaningful change, briefly explain the relevant concept and why the change fits the project's existing design; connect it to the plan's learning objectives.
2. Reuse repository patterns. Keep changes surgical, type-safe, and limited to the approved scope. Do not add dependencies or commit unless the user explicitly approves.
3. Run the smallest relevant tests, lint, build, or other checks available. Report exact commands and results. Do not claim a check passed unless it ran and passed; clearly identify checks that could not be run.
4. Update the plan's status and implementation outcome with the files changed and verification results.
5. After each completed task implementation, update the repository-root `MEMORY.md`. Keep exactly these three top-level content sections:
   - `Last files modified`: list the files changed by the most recently completed task, newest task first where a short history is useful.
   - `Last task implemented`: state the actual outcome; distinguish application behavior from workflow/documentation-only work.
   - `What the system does now`: describe current implemented behavior and relevant project checkpoint. Do not present planned or unverified behavior as implemented.
6. In the memory update, retain or add the exact verification outcomes and current follow-up needed to understand the project. Do not record secrets. The memory itself is maintained by this workflow and need not list itself as a changed application file.
7. Summarize the implementation, learning concepts, changed files, verification, and remaining work. Do not commit unless explicitly requested.

If implementation cannot be completed, state why and update the plan and `MEMORY.md` accurately with partial progress and checks; never report partial work as complete.

---
name: plan
description: 'Slash command /plan <task name>: create a repository-grounded, learning-oriented implementation plan for a task already analyzed with /analize.'
metadata:
  opencode/autoinvoke: false
---

# Plan a development task

Use this skill when the user invokes `/plan "task name"`. This is stage two. It produces a reviewable plan; it does not implement the task.

In OpenCode, this skill is loaded via the `skill` tool with ID `plan`, usually through the `/plan` command in `.opencode/commands/plan.md`. The command runs in the current session so the prior `/analize` analysis stays in conversation context.

## Required procedure

1. Obtain the task name. If it is missing, ask the user.
2. Require the analysis from `/analize` to be present in the current conversation. If it is absent, stop and ask the user to run `/analize "task name"` first.
3. Read the root `MEMORY.md` and re-check the relevant current source, tests, instructions, and Git status. Follow all applicable repository instructions.
4. Create one plan at `docs/plans/<task-slug>.md`, using a short lowercase kebab-case slug. Do not overwrite an existing plan; choose a distinct filename or ask the user.
5. Write a plan that includes:
    - Task, date, and status `Draft — awaiting plan check`
    - Desired outcome, scope, and explicit non-goals
    - An `Analysis carried forward` section summarizing the `/analize` findings and evidence
    - Current-state evidence and relevant files
    - Learning objectives and a short just-in-time concept explanation
    - Ordered implementation steps, with a brief rationale for important decisions
    - Tests and verification commands, plus expected results
    - Risks, dependencies, and unresolved questions
    - Reminder that implementation is not authorized until the user checks the plan and invokes `/implement` with this plan path
6. Keep the work sized for small, understandable increments. Prefer existing project patterns and avoid speculative work.
7. Show the saved plan path and summarize the approach and learning goals. Stop and ask the user to invoke `/check "docs/plans/<task-slug>.md"` to review and clarify it.

Do not edit application code, run implementation steps, or represent assumptions as repository facts in this stage.

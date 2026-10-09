---
name: check
description: "Slash command /check <plan-file>: review, validate, clarify, and revise a CaribeOps plan against the current repository; do not implement."
argument-hint: '"docs/plans/plan-file.md"'
user-invocable: true
disable-model-invocation: true
---

# Check and clarify a task plan

Use this skill when the user invokes `/check "path/to/plan.md"`. This is stage three. Review and improve the plan; do not implement it.

## Required procedure

1. Obtain the plan path. If it is missing, ask the user which plan to check.
2. Require a plan created during `/plan` that includes an `Analysis carried forward` section (the expected location is `docs/plans/`). If it is unavailable, stop and ask the user to run `/analize` and `/plan` first.
3. Read `MEMORY.md`, the full plan, current Git status, and the relevant repository source, tests, and instructions. Confirm proposed paths, existing behavior, dependencies, and verification commands against the project.
4. Independently challenge the plan for unclear scope, unsupported assumptions, missing edge cases, incorrect file paths, unnecessary work, learning value, and weak or missing verification.
5. If a decision genuinely requires the user's preference, ask a focused question and wait before resolving it. Do not silently choose between materially different behaviors.
6. Revise the plan file to resolve evidence-based issues and incorporate the user's answers. Preserve its task scope. Include a concise `Plan check` section listing findings and changes, and set status to `Checked — awaiting user approval`.
7. Show the important findings and final plan summary. Stop and ask the user to review the plan. Do not edit application code.
8. Tell the user that invoking `/implement "<same plan path>"` after reviewing the checked plan is their explicit approval to begin implementation.

If the plan is already checked, re-check it against the current repository and make any needed revisions before asking for approval again. Never mark a plan as user-approved on the user's behalf.

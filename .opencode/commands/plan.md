---
description: Create a repository-grounded implementation plan for a task already analyzed with /analize; do not implement
agent: plan
subagent: false
---

Load the `plan` skill via the skill tool and follow its procedure exactly. Do not edit application code.

Task name: $ARGUMENTS

Require the `/analize` analysis in the current conversation; if absent, stop and ask the user to run `/analize "task name"` first. Write the plan to `docs/plans/<task-slug>.md` without overwriting an existing plan, then ask the user to invoke `/check "docs/plans/<task-slug>.md"`.

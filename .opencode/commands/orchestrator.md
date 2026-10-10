---
description: Coordinate the CaribeOps analize, plan, and check workflow in order, then hand off for explicit implementation approval
agent: plan
subagent: false
---

Load the `orchestrator` skill via the skill tool and follow its procedure exactly. Do not implement application changes in this stage.

Task name: $ARGUMENTS

If the task name is missing or unclear, ask the user before starting. Preserve the analize → plan → check order, keep all deliverables in the current conversation, write the reviewable plan to `docs/plans/<task-slug>.md`, end with status `Checked — awaiting user approval`, and ask the user to review it and explicitly invoke `/implement "<same plan path>"` to authorize implementation.

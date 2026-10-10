---
description: Review, validate, and revise a CaribeOps plan against the current repository; do not implement
agent: plan
subagent: false
---

Load the `check` skill via the skill tool and follow its procedure exactly. Do not edit application code.

Plan file: $ARGUMENTS

If the plan path is missing, ask the user. Require the `Analysis carried forward` section; if unavailable, stop and ask the user to run `/analize` and `/plan` first. Revise the plan, set status to `Checked — awaiting user approval`, and tell the user that invoking `/implement "<same plan path>"` is the explicit approval to begin implementation.

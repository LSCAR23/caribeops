---
description: Implement a checked plan after explicit user approval, verify changes, and update MEMORY.md
agent: build
subagent: false
---

Load the `implement` skill via the skill tool and follow its entire procedure. This is the only stage that implements application changes.

Plan file: $ARGUMENTS

If the plan path is missing, ask the user. Require status `Checked — awaiting user approval` (or later) plus a completed `Plan check` section; if not met, stop and ask the user to run `/check` first. Treat this invocation as approval of that checked plan only. Follow the plan in small increments, run the smallest relevant tests and checks, report exact commands and results, update the plan status/outcome, update `MEMORY.md`, and summarize without committing unless explicitly requested.

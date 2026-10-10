# CaribeOps — OpenCode workflow

This repo uses an ordered learning workflow. Use it for every CaribeOps task:

1. `/orchestrator "task name"` runs `/analize` → `/plan` → `/check` in the current session, then stops. It never implements.
2. Review the checked plan in `docs/plans/`.
3. `/implement "docs/plans/<task-slug>.md"` is the explicit approval to implement. Only this stage edits application code.

Skills live in `.opencode/skills/` (`analize`, `plan`, `check`, `implement`, `orchestrator`). Commands live in `.opencode/commands/` and load those skills in the current session (`subagent: false`) so analysis context is preserved. Skill IDs come from directory names; keep them stable (note `analize` keeps its existing spelling).

Plans live in `docs/plans/` and must keep `Analysis carried forward` and `Plan check` sections plus an explicit status (`Draft — awaiting plan check` → `Checked — awaiting user approval` → implementation outcome).

Always read repository-root `MEMORY.md` first, preserve `git status` user changes, follow path `AGENTS.md` files, and never present planned or unverified behavior as implemented. After each `/implement`, update `MEMORY.md`'s three sections (`Last files modified`, `Last task implemented`, `What the system does now`) with actual files, outcome, and exact verification results.

Legacy VS Code definitions remain in `.github/skills/` for reference; `.opencode/` is canonical for OpenCode.

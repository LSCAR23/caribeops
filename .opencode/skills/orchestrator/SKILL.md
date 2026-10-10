---
name: orchestrator
description: 'Slash command /orchestrator "task name": coordinate the CaribeOps analyze, plan, and check workflow in order, then hand off for explicit implementation approval.'
metadata:
  opencode/autoinvoke: false
---

# Orchestrate the development workflow

Use this skill when the user invokes `/orchestrator "task name"`. Coordinate the existing workflow stages in order, using their skill files as the source of truth:

1. [analize](../analize/SKILL.md)
2. [plan](../plan/SKILL.md)
3. [check](../check/SKILL.md)
4. [implement](../implement/SKILL.md)

In OpenCode, this skill is loaded via the `skill` tool with ID `orchestrator`, usually through the `/orchestrator` command in `.opencode/commands/orchestrator.md`. That command runs in the current session (and under an agent without application-edit permission) so the analysis, plan, and check stay in one conversation and no implementation happens prematurely. When a stage needs another workflow skill, load it explicitly via the `skill` tool by its ID (`analize`, `plan`, `check`); do not rely on automatic skill discovery.

Do not merely tell the user to invoke the first three commands. Carry out their procedures as stages of this orchestration, preserving each stage's requirements, user questions, safety checks, and deliverables. Do not duplicate or weaken their instructions.

## Procedure

1. Read all four referenced `SKILL.md` files before starting. Obtain the task name from the invocation; if it is missing or unclear, ask the user.
2. Run the `/analize` procedure first. Carry its repository evidence, questions, and learning objectives forward. If analysis identifies a question that must be answered before planning, ask it and wait; do not proceed on an unresolved material decision.
3. Run the `/plan` procedure using the completed analysis. Create the reviewable plan at `docs/plans/<task-slug>.md`, including its required `Analysis carried forward` section. Do not overwrite an existing plan. If a plan-stage prerequisite is missing or a decision needs the user's input, pause and resolve it before continuing.
4. Run the `/check` procedure against that plan and the current repository. Revise the plan as needed, record its `Plan check`, and set its status to `Checked — awaiting user approval`. Ask and wait for the user on any material decision required by the check.
5. Stop after the checked plan is ready. Show the plan path and important check findings, then ask the user to review it and explicitly invoke `/implement "<same plan path>"` to authorize the final stage. Do not implement changes during `/orchestrator`; the initial `/orchestrator` invocation is not implementation approval.
6. When the user later invokes `/implement` with that checked plan, follow the implement skill's entire procedure. Never claim the implementation stage has run unless that invocation occurs and implementation is actually completed.

At every stage, preserve user changes, inspect current repository state and applicable instructions, distinguish evidence from assumptions, and report only verification that was actually performed. If interrupted by a required question, resume from the first incomplete stage after the user answers; do not repeat completed work unnecessarily.

---
name: analize
description: "Slash command /analize <task name>: analyze a CaribeOps task by reading MEMORY.md and the current project, then explain behavior, gaps, risks, and learning needs. Do not plan or implement."
argument-hint: '"task name"'
user-invocable: true
disable-model-invocation: true
---

# Analyze a development task

Use this skill when the user invokes `/analize "task name"`. This is stage one of the repository's required learning-oriented workflow. Do not plan or implement in this stage.

## Required procedure

1. Obtain the task name from the invocation. If it is missing or unclear, ask the user what task to analyze.
2. Read the repository-root `MEMORY.md` first. Treat it as a starting point, not as proof that remembered behavior still exists.
3. Check `git status` and preserve all existing user changes.
4. Inspect the relevant source files, tests, roadmap, and all applicable `AGENTS.md`, Copilot instructions, and path-specific instructions. For Laravel changes, follow the Laravel repository rules and activate the relevant existing Laravel skills.
5. Compare the requested behavior with what the current code actually implements. Separate observed facts from unverified assumptions; identify dependencies, edge cases, risks, and likely affected areas.
6. Make this useful for learning: explain the relevant concepts and terminology briefly, what the project already demonstrates, and what the task would teach. Point to existing project documentation and primary references where useful.
7. Present an analysis with:
   - Task and intended outcome
   - Current behavior and repository evidence
   - Relevant concepts and learning objectives
   - Gaps, dependencies, affected areas, risks, and unknowns
   - Questions that should be answered before planning, if any
8. Stop. Do not create or edit a plan or application file. Tell the user to invoke `/plan "task name"` when they are ready for the next stage.

Do not claim tests passed unless you ran them. Do not infer implementation from roadmap entries or memory alone.

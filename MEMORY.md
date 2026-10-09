# Project Memory

## Last files modified

- `.github/skills/analize/SKILL.md` — task-specific project analysis workflow.
- `.github/skills/plan/SKILL.md` — learning-oriented implementation planning workflow.
- `.github/skills/check/SKILL.md` — plan clarification and review workflow.
- `.github/skills/implement/SKILL.md` — approved implementation and memory-update workflow.

## Last task implemented

Created a four-stage, slash-invoked development workflow for analyzing, planning, reviewing, and implementing tasks while learning. No application runtime code was changed. The most recent application task already implemented before this workflow was D1-20, creating developer commands (`Makefile` and `scripts/dev.ps1`).

## What the system does now

CaribeOps is a learning and portfolio monorepo for a tourism operations and analytics platform. Its planned stack is Next.js for the dashboard, Laravel for the core API, Go for read-heavy analytics, PostgreSQL for persistence, and Docker Compose for local development.

The repository currently contains the Day 1 service foundation: Compose definitions for PostgreSQL, Laravel, Next.js, and Go; Laravel and Go health endpoints; the initial Next.js app page; environment examples; and developer commands. The Go health endpoint has a unit test. The roadmap is in `docs/README.md` and `docs/day-1-foundation.md` through `docs/day-7-portfolio-interview.md`.

The latest recorded application task is D1-20. Do not assume the Day 1 final checkpoint, service networking verification, smoke checks, or later roadmap tasks are complete without checking the repository and running the relevant verification.

Use the slash skills in order: `/analize "task name"` → `/plan "task name"` → `/check "docs/plans/plan-file.md"` → `/implement "docs/plans/plan-file.md"`. Plans live in `docs/plans/`. Review the checked plan before invoking `/implement`; that invocation is the approval to proceed. Every completed implementation must update this file's three sections with the actual changed files, task outcome, current project behavior/status, and exact verification results.

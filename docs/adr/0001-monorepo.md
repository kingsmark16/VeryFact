# ADR 0001: Use a Monorepo for Backend, Frontend, and AI Workflow

- Status: Accepted
- Date: 2026-10-18

## Context
VeryFact consists of a Spring Boot backend (`backend/`), a React + Vite frontend (`frontend/`), shared OpenAPI contracts (`contracts/`), and AI agent instructions (`AGENTS.md`, `.agents/`). Keeping these in separate repositories would require synchronizing API changes and agent rules across repos.

## Decision
Keep the backend, frontend, OpenAPI contract, infrastructure (`docker-compose.yml`), documentation (`docs/`), and AI agent configuration in a single Git repository.

## Consequences
- Single CI pipeline validates backend, frontend, and OpenAPI contract drift together.
- AI coding agents have full visibility across both backend DTOs/controllers and frontend components in one workspace.
- Atomic commits can update an API endpoint, regenerate the TypeScript client, and update the React UI together.


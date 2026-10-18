# VeryFact — Agent Instructions

VeryFact is a public (no login) fake-news checker. Users submit text, an article URL,
or images; the backend extracts claims, checks them with the Google Fact Check Tools API
and Gemini (gemini-3.8-flash + Google Search grounding), and returns verdicts with sources.

## Stack
- backend/: Spring Boot 4.1.x, Java 25, Maven wrapper, PostgreSQL 18, Flyway, JPA
- frontend/: React 19 + Vite 8 + TypeScript, Tailwind CSS v4, shadcn/ui, Oxlint, Prettier, Vitest
- docker-compose.yml: PostgreSQL 18 for local dev

## Commands
| Task | Command |
|---|---|
| Start DB | `docker compose up -d` |
| Run backend | `cd backend; .\mvnw.cmd spring-boot:run` |
| Backend build + tests + format check | `cd backend; .\mvnw.cmd verify` |
| Fix Java formatting | `cd backend; .\mvnw.cmd spotless:apply` |
| Run frontend | `cd frontend; npm run dev` |
| Frontend full check | `cd frontend; npm run check` |
| Fix frontend formatting | `cd frontend; npm run format` |

## Rules
Read `.agents/rules/` before coding. Read `docs/ARCHITECTURE.md` for the design and
`docs/BACKLOG.md` for the current task. Record significant decisions in `docs/adr/`.

## Definition of Done
- [ ] `.\mvnw.cmd verify` and `npm run check` pass
- [ ] Tests added for new logic and new endpoints
- [ ] API changed? Regenerate the TS client; never hand-edit generated files
- [ ] No secrets committed, no user content or IPs logged
- [ ] BACKLOG.md updated
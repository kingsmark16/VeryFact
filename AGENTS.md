# VeryFact — Agent instructions

VeryFact is a public, account-free fact checker for text, article URLs, and images.
The default verification route uses Gemini `gemini-3.5-flash-lite` for query planning
and evidence evaluation, with Google organic results retrieved through SerpApi.
Google Fact Check Tools is optional. Native Gemini Google Search is explicitly
configurable; there are no demo verdicts or automatic provider/model fallbacks.

## Stack

- `backend/`: Spring Boot 4.1.1, Java 25 virtual threads, Maven wrapper, JPA, Flyway.
- `frontend/`: React 19, Vite 8, TypeScript 6, Tailwind v4, shadcn/Base UI,
  TanStack Query, Axios, i18next, Oxlint, Prettier, Vitest.
- `docker-compose.yml`: PostgreSQL 18; optional `fullstack` backend/Nginx frontend.
  Read `docs/DEPLOYMENT.md` for current Compose configuration gaps.

## Commands

| Task                               | Command                                  |
| ---------------------------------- | ---------------------------------------- |
| Start DB                           | `docker compose up -d`                   |
| Run backend                        | `cd backend; .\mvnw.cmd spring-boot:run` |
| Backend build, tests, format check | `cd backend; .\mvnw.cmd verify`          |
| Fix Java formatting                | `cd backend; .\mvnw.cmd spotless:apply`  |
| Run frontend                       | `cd frontend; npm run dev`               |
| Frontend full check                | `cd frontend; npm run check`             |
| Fix frontend formatting            | `cd frontend; npm run format`            |

## Rules and current behavior

Read `.agents/rules/` before coding, `docs/ARCHITECTURE.md` for implementation,
`docs/PRODUCT_SPEC.md` for current features, and `docs/BACKLOG.md` for remaining work.
Record significant design decisions in `docs/adr/`; identify superseded historical
behavior instead of treating every ADR as the current specification.

Checks and excerpts are public and stored with generated reports. Never persist
uploaded image bytes or client IPs, or log submitted content, keys, or raw provider
errors. Do not describe the app as storing no user content.

Loading uses the real server stage with one message and an orbital animation;
pause affects animation only. Preserve reduced-motion support, accessible focus,
report scroll behavior, and counts without leading-zero padding. Interface copy
belongs in both English/Filipino resources; current initialization is English.

## Definition of done

- [ ] `.\mvnw.cmd verify` and `npm run check` pass; explain any blocked checks.
- [ ] Add appropriate tests for new logic/endpoints and regression coverage for fixes.
- [ ] API changed? Regenerate OpenAPI and TypeScript schemas together; never hand-edit them.
- [ ] No secrets committed, submitted content/IPs logged, or uploaded images persisted.
- [ ] Update affected documentation and `docs/BACKLOG.md` to match delivered behavior.

# Testing (always apply)

- Backend: JUnit Jupiter and AssertJ. Unit-test services, use `@WebMvcTest` for
  controllers, and Testcontainers PostgreSQL for repository/integration tests.
- Docker is required for backend integration checks. Local Compose uses PostgreSQL
  18; the current Testcontainers configuration uses `postgres:latest`.
- Never call real Gemini, SerpApi, or Fact Check APIs in tests; mock interfaces or
  intercept HTTP clients. Live validation is a separate, explicitly scoped activity.
- `BackendApplicationTests` exports `contracts/openapi.json` during verification;
  regenerate frontend schemas after intentional API changes.
- Frontend: Vitest and Testing Library, with tests colocated beside pages/components.
  Query by accessible role/label rather than CSS class where possible.
- Every bug fix gets a regression test. Add appropriate coverage for new logic/endpoints.
- Run `.\mvnw.cmd verify` from `backend/` and `npm run check` from `frontend/`.
  Document actual results and any blockers.

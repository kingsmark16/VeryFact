# VeryFact backend

Spring Boot 4.1.1 on Java 25, with virtual-thread async processing, PostgreSQL/JPA, Flyway, the Google Gen AI SDK, and Jsoup. The [architecture guide](../docs/ARCHITECTURE.md) documents the current API and verification pipeline.

## Run

Install Java 25 and Docker. From the root, copy `.env.example` to ignored `.env`, set `GEMINI_API_KEY` and `SERPAPI_API_KEY`, and run `docker compose up -d`. Then from `backend/`:

```powershell
.\mvnw.cmd spring-boot:run
```

Spring optionally imports `.env` from this directory and its parent. The default model is `gemini-3.5-flash-lite` and default search provider is `serpapi`. `GOOGLE_FACTCHECK_API_KEY` is optional. The app can start without provider credentials, but verification will fail. Restart after changing configuration.

API port defaults to 8080 (`PORT` override). Health: `/actuator/health`; OpenAPI: `/v3/api-docs`; Swagger: `/swagger-ui.html`. See the [environment reference](../docs/DEPLOYMENT.md) for all settings and container limitations.

## Check and format

```powershell
.\mvnw.cmd verify
.\mvnw.cmd spotless:apply
```

`verify` runs tests, packages the app, and checks Java formatting. Tests mock AI/search integrations; they do not call live provider APIs. Integration tests require Docker and currently use `postgres:latest`, while local Compose pins PostgreSQL 18. Packaging can fail on Windows when a running process holds the output JAR; release that process before retrying packaging.

`BackendApplicationTests` also exports `../contracts/openapi.json`. For an intentional API change:

```powershell
.\mvnw.cmd test -Dtest=BackendApplicationTests
```

Then regenerate frontend schemas with `npm run gen:api` from `frontend/`, format them, and run both full checks. Generated artifacts must be committed together and never edited by hand.

## Implementation map

- `check/`: input validation/cache lookup, HTTP endpoints, async worker, abandoned-check recovery, entities/repository and record DTOs.
- `ai/`: `FactCheckAi`, default SerpApi-backed evaluation, native Gemini Search, prompts, shared client and deadlines.
- `search/`: SerpApi HTTP client, provider settings, public search failures.
- `factcheck/`: optional Google Fact Check Tools lookup.
- `extractor/`: SSRF validation and bounded Jsoup extraction.
- `config/`: async/scheduling, CORS, fixed-window submission limiting.
- `common/`: ProblemDetail exception mapping, hashing, slug and image validation.
- `src/main/resources/db/migration/`: Flyway schema migrations; add new migrations rather than editing applied ones.

Submission work is in-process, not a durable queue. Restarted work is not resumed; cleanup fails pending/processing rows older than five minutes. Reports persist publicly, including excerpts and generated content. Uploaded image bytes and client IPs are not stored in the database. See [product behavior](../docs/PRODUCT_SPEC.md) and [backend conventions](AGENTS.md).

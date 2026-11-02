# VeryFact

VeryFact is a public, account-free fact checker for pasted text, public article URLs, and screenshots. It produces shareable verdict reports with explanations and source links. AI can make mistakes; read the evidence before sharing a report.

## Current features

- Three input modes: text (20–20,000 characters), an HTTP(S) article URL, or up to four JPEG/PNG/WebP images (5 MiB each). URL and image modes accept optional text context.
- Live Google results through SerpApi, evaluated by Gemini. The application default is `gemini-3.5-flash-lite`; native Gemini Google Search is an explicitly configured alternative.
- Optional Google Fact Check Tools lookup supplies published fact-check leads. Missing optional credentials or lookup failures do not stop verification.
- Public reports at `/r/{slug}` with overall and per-claim verdicts, explanations, confidence, evidence links, and notes. Reports support claim-category filtering and collapsible evidence/submission sections.
- A centered orbital loading indicator shows actual server activity. Its pause control pauses animation only. There are no estimated percentages or simulated stages.
- The homepage shows up to three recent reports when available; the API returns up to six completed reports.
- Matching completed reports marked with confirmed-search provenance can be reused for one hour. Provider failures, invalid reports, and missing search evidence fail visibly. There are no demo verdicts or automatic provider fallbacks.
- English and Filipino interface resources, keyboard navigation, reduced-motion support, and clipboard sharing with manual-copy guidance on failure. The interface currently initializes in English and has no language selector.

## Data and privacy

Checks are public. PostgreSQL stores submission excerpts (first 500 text characters plus an ellipsis when truncated), submitted URLs, content hashes, report contents, status, timestamps, and model provenance. Reports and recent-check responses expose excerpts. Uploaded image bytes and full raw submission bodies are not stored as separate database fields; generated reports can repeat submitted material. No report deletion or retention cleanup is implemented.

Application-owned verification logs omit submitted content, raw provider errors, API keys, and client IPs. Avoid enabling framework request/body debugging for real submissions. The rate limiter keeps salted IP hashes in memory. Hosting/proxy access logs have separate settings. Gemini receives submission text/images; SerpApi receives generated search queries; publishers receive page requests. Do not submit personal information.

## Stack

| Area     | Implementation                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------- |
| Backend  | Spring Boot 4.1.1, Java 25 virtual threads, Maven wrapper, JPA, Flyway, Google Gen AI SDK, Jsoup  |
| Database | PostgreSQL 18 in local Compose                                                                    |
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS v4, shadcn/Base UI, TanStack Query, Axios, i18next   |
| Quality  | JUnit/AssertJ, Testcontainers, Vitest/Testing Library, Spotless, Oxlint, Prettier, GitHub Actions |

## Local development

Install Java 25, Node.js 24, and Docker with Compose. From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d
```

Set these values in the ignored `.env` file:

```dotenv
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_REQUEST_TIMEOUT=60s
GOOGLE_SEARCH_PROVIDER=serpapi
SERPAPI_API_KEY=your-serpapi-key
```

`GOOGLE_FACTCHECK_API_KEY` is optional and never falls back to the Gemini key. Provider access and quotas belong to the configured accounts; the app does not enable billing or guarantee a free allowance. Restart the backend after configuration changes.

Run the backend and frontend in separate terminals:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm ci
npm run dev
```

Spring imports `.env` from its working directory and parent directory. Vite proxies `/api` to `http://localhost:8080`.

- App: <http://localhost:5173>
- Swagger: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

For containers, see the [deployment guide](docs/DEPLOYMENT.md). The base Compose file has an older model fallback and omits SerpApi configuration forwarding; the guide includes a working override.

## Checks

```powershell
cd backend
.\mvnw.cmd verify
```

```powershell
cd frontend
npm run check
```

Backend integration tests require Docker and currently use `postgres:latest`. Verification also exports `contracts/openapi.json`. Frontend checks run linting, formatting, type checks, tests, and the production build. CI has separate backend/frontend jobs; it does not currently enforce generated-contract drift. See the [backend guide](backend/README.md) and [frontend guide](frontend/README.md).

## HTTP API

| Method | Path                 | Behavior                                                                                                                            |
| ------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/checks`        | JSON `{ "text": "..." }` or multipart `text`, `url`, repeated `images` fields. Returns `202` for new work or `200` for a cache hit. |
| `GET`  | `/api/checks/{slug}` | Status, stage, submission excerpt, and report or failure details.                                                                   |
| `GET`  | `/api/checks/recent` | Up to six completed reports with a verdict, newest creation time first.                                                             |

Example new-submission response:

```json
{
  "slug": "exampleSlug",
  "status": "PENDING",
  "stage": "QUEUED",
  "cached": false
}
```

Sources contain `title`, `url`, and `publisher`. Verdicts are `TRUE`, `MOSTLY_TRUE`, `MIXED`, `MOSTLY_FALSE`, `FALSE`, `UNVERIFIABLE`, and `SATIRE_OR_OPINION`. Confidence is a model estimate from 0 to 1, not a measured probability of correctness. See the [architecture](docs/ARCHITECTURE.md) and generated [OpenAPI contract](contracts/openapi.json).

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md): implemented user experience and limits.
- [Architecture](docs/ARCHITECTURE.md): pipeline, API, persistence, and failure behavior.
- [Deployment](docs/DEPLOYMENT.md): configuration, containers, hosting, and validation.
- [Backlog](docs/BACKLOG.md): delivered work and remaining gaps.
- [Decision records](docs/adr/): historical decisions and later amendments.
- [Agent instructions](AGENTS.md) and [repository rules](.agents/rules/): contribution conventions.

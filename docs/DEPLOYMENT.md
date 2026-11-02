# VeryFact — Deployment and configuration

Last synchronized with the repository: 2026-11-02. This guide describes repository configuration; it does not confirm a hosted deployment, provider account allowance, or hosting plan availability.

## Environment reference

Spring reads environment variables and optionally imports `.env` from its working directory or parent. Vite reads frontend build-time environment settings. Restart/redeploy after changing backend values; rebuild the frontend after changing `VITE_API_BASE_URL`.

| Variable                          | Application default                           | Purpose                                                                                                      |
| --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`                  | Empty                                         | Required for verification.                                                                                   |
| `GEMINI_MODEL`                    | `gemini-3.5-flash-lite`                       | Configured model; default SerpApi route requires Gemini 3. Base Compose has a different fallback; see below. |
| `GEMINI_REQUEST_TIMEOUT`          | `60s`                                         | AI operation deadline, 1 ms–120 seconds; not the whole submission pipeline.                                  |
| `GOOGLE_SEARCH_PROVIDER`          | `serpapi`                                     | `serpapi` or explicitly selected `gemini`.                                                                   |
| `SERPAPI_API_KEY`                 | Empty                                         | Required for the default Google-results route.                                                               |
| `GOOGLE_FACTCHECK_API_KEY`        | Empty                                         | Optional Fact Check Tools lookup; never inherits the Gemini key.                                             |
| `SPRING_DATASOURCE_URL`           | Constructed JDBC PostgreSQL URL               | Override with a JDBC URL for managed PostgreSQL, including required SSL settings.                            |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `localhost` / `5432`                          | Used when constructing the default datasource URL.                                                           |
| `POSTGRES_DB` / `POSTGRES_USER`   | `veryfact` / `veryfact`                       | Database name and username.                                                                                  |
| `POSTGRES_PASSWORD`               | `change-me`                                   | Local placeholder; configure the actual database password on hosted services.                                |
| `RATE_LIMIT_PER_HOUR`             | `10`                                          | Submission limit per process/remote address; nonpositive values fall back to 10.                             |
| `CORS_ALLOWED_ORIGINS`            | `http://localhost:5173,http://localhost:3000` | Comma-separated browser origins allowed on `/api/**`; use deployed frontend origins.                         |
| `PORT`                            | `8080`                                        | Backend listening port.                                                                                      |
| `VITE_API_BASE_URL`               | `/`                                           | Frontend build-time API origin. Requests append `/api/checks`; do not append `/api` to this value.           |

Required provider access and quotas must be verified in the selected accounts. No automatic model/provider fallback, billing upgrade, or demo engine exists. Each uncached default-path report normally requires two Gemini requests and one or two SerpApi searches. Native Gemini Search (`GOOGLE_SEARCH_PROVIDER=gemini`) needs account/model access to native grounding; it does not use SerpApi.

## Local processes

Follow [README.md](../README.md): copy `.env.example`, set Gemini and SerpApi keys, run `docker compose up -d`, and start Spring and Vite separately. Compose starts only the `db` service by default. PostgreSQL data persists in the `pgdata` volume at `/var/lib/postgresql` inside the PostgreSQL 18 container.

## Full-stack Compose

The base `docker-compose.yml` includes `db`, `backend`, and `frontend`; the latter two require the `fullstack` profile. The frontend serves static assets through Nginx on port 3000 and proxies `/api/` to `backend:8080`. The backend is exposed on 8080 and PostgreSQL on 5432. Only the database has a Compose healthcheck; frontend dependency ordering does not prove backend readiness.

**Current limitation:** Compose's backend environment omits `SERPAPI_API_KEY`, `GOOGLE_SEARCH_PROVIDER`, `GEMINI_REQUEST_TIMEOUT`, and `RATE_LIMIT_PER_HOUR`. Its model fallback is `gemini-3.8-flash`, whereas Spring and `.env.example` use `gemini-3.5-flash-lite`. Compose reads root `.env` for interpolation but does not copy it into the backend image. A populated root `.env` alone therefore does not configure default-path verification in containers.

Create a local override file named `compose.local.yaml` (keep local deployment files containing secrets out of version control) with the following references, and keep the actual values in ignored `.env`:

```yaml
services:
  backend:
    environment:
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-3.5-flash-lite}
      GOOGLE_SEARCH_PROVIDER: ${GOOGLE_SEARCH_PROVIDER:-serpapi}
      SERPAPI_API_KEY: ${SERPAPI_API_KEY:-}
      GEMINI_REQUEST_TIMEOUT: ${GEMINI_REQUEST_TIMEOUT:-60s}
      RATE_LIMIT_PER_HOUR: ${RATE_LIMIT_PER_HOUR:-10}
```

From the root:

```powershell
docker compose -f docker-compose.yml -f compose.local.yaml --profile fullstack up --build -d
docker compose -f docker-compose.yml -f compose.local.yaml ps
```

Open <http://localhost:3000>. Check <http://localhost:8080/actuator/health> separately. Keep `PORT=8080` for the provided Nginx upstream and port mapping, unless all dependent settings are updated together.

The backend image builds with Temurin Java 25, skips tests during image packaging, and runs as a non-root user. The frontend image builds with Node 24 and serves using Nginx 1.29. Run repository quality checks before image builds; Docker packaging is not a substitute for them.

## Hosting the backend and database

For a Docker-capable host such as Render or Railway, use `backend/` as the build context/root and `backend/Dockerfile`. Provision PostgreSQL and configure:

```dotenv
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/veryfact?sslmode=require
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.5-flash-lite
GOOGLE_SEARCH_PROVIDER=serpapi
SERPAPI_API_KEY=your-serpapi-key
GEMINI_REQUEST_TIMEOUT=60s
CORS_ALLOWED_ORIGINS=https://your-frontend.example
```

Use your database provider's actual connection/SSL settings. A `postgres://` or `postgresql://` service URL is not directly a JDBC URL; convert the host/port/database and provide credentials separately. Flyway applies migrations at startup; JPA validates the schema. Use `/actuator/health` for the backend health endpoint and the platform's assigned `PORT` when applicable. The app does not provision cloud resources or choose a hosting plan.

The limiter uses `request.getRemoteAddr()` and is neither shared across instances nor persistent across restarts. Verify actual proxy address handling in the chosen platform; users behind a common proxy may share a bucket. Nginx sets forwarding headers, but the repository does not explicitly configure Spring's forwarded-header strategy.

## Hosting the frontend

For static hosting:

1. Use `frontend/` as root, Node 24, `npm ci && npm run build` as the build command, and `dist` as output.
2. Set `VITE_API_BASE_URL=https://your-backend.example` before building. Omit it only when the frontend origin already proxies `/api`.
3. Rewrite non-asset application routes to `/index.html`, including `/r/*`, so public reports open directly.
4. Set the backend's `CORS_ALLOWED_ORIGINS` to the exact frontend HTTPS origin. Backend CORS permits GET, POST, OPTIONS and exposes `Retry-After`.

The stock frontend Dockerfile/Nginx config targets Compose's `backend:8080`; it is not a generic external-host proxy. To host that container separately, adapt the upstream and supply frontend build configuration as needed. Setting `VITE_API_BASE_URL` only at runtime on a prebuilt static container does not change the bundle. Nginx listens on port 80; adapt that if the host requires another port.

## Validation and troubleshooting

- Check backend health, then open `/` and a direct `/r/{slug}` link on the hosted frontend.
- Submit a fresh, non-sensitive claim. Confirm that polling reaches `COMPLETED`, inspect the cited pages, and exercise URL/image modes. Identical confirmed reports created within one hour can be reused; use fresh content when checking live requests.
- The API exposes `modelVersion`: default-path reports end in `-serpapi-search-v1`; native reports end in `-search-v1`. The UI intentionally hides this badge. The suffix indicates the implementation's search-evidence checks, not an accuracy certification.
- Missing SerpApi configuration, quota failures, unavailable models, invalid citations, or absent search evidence produce failed reports. A failed report stays failed; submit a new check after fixing configuration.
- Optional Fact Check Tools authentication failure does not bypass required Google Search or stop an otherwise valid search-backed report.
- Browser requests have a 90-second timeout. The default AI deadline is 60 seconds, but submitted-URL extraction and optional lookup precede it. A higher configured AI deadline can exceed the browser's request timeout; actual polling requests are separate from the async verification work.
- Every 30 seconds, cleanup fails unfinished checks created over five minutes earlier, including interrupted work after restart.
- Measure representative completion times and source relevance after deployment. Earlier local samples in ADRs do not establish hosted latency.

Reports/excerpts are public and persistent; no deletion/retention cleanup is implemented. Application logs avoid content and IPs, while Nginx/platform access logs require separate review. Do not put actual keys, submitted content, or database credentials in diagnostic output. The [backlog](BACKLOG.md) records unresolved deployment/configuration work.

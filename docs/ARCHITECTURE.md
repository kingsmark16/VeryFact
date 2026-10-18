# VeryFact — Architecture

## System Overview

```mermaid
flowchart LR
    U["Visitor (browser)"] --> FE["React SPA (Vite build, served by Nginx)"]
    FE -- "/api/*" --> BE["Spring Boot 4 API"]
    BE --> RL["Rate limiter (Bucket4j, per IP)"]
    BE --> DB[("PostgreSQL 18")]
    BE --> EX["URL extractor (Jsoup + SSRF guard)"]
    BE --> FC["Google Fact Check Tools API"]
    BE --> GM["Gemini 3.8 Flash + Google Search grounding"]
```

## Check Pipeline

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as CheckController
    participant S as CheckService (async worker)
    participant DB as Postgres
    participant G as Gemini
    participant F as FactCheck API

    FE->>API: POST /api/checks (text | url | images[])
    API->>API: validate + rate-limit + normalize + SHA-256
    API->>DB: cache lookup by content_hash
    alt cache hit (completed, < 7 days)
        API-->>FE: 200 {slug, status: COMPLETED}
    else miss
        API->>DB: insert check (PENDING)
        API-->>FE: 202 {slug, status: PENDING}
        S->>S: URL? fetch and extract article text
        S->>G: Stage 1, extract claims + language (text + images, JSON schema)
        S->>F: claims:search for each claim (top 3 claims)
        S->>G: Stage 2, verify claims (google_search tool + fact-check matches, JSON schema)
        S->>DB: save verdicts, sources (COMPLETED / FAILED)
    end
    loop every 1.5s
        FE->>API: GET /api/checks/{slug}
    end
```

## REST API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/checks` | `multipart/form-data`: `text?`, `url?`, `images[]?` (max 4 × 5 MB, jpeg/png/webp; text ≤ 20,000 chars). Returns `202` (new) or `200` (cache hit) with `{slug, status}` |
| `GET` | `/api/checks/{slug}` | Status + full result (`PENDING / PROCESSING / COMPLETED / FAILED`, current `stage` for the progress UI) |
| `GET` | `/actuator/health` | Health check for Docker |
| `GET` | `/v3/api-docs` | OpenAPI spec (source for TypeScript client generation) |


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
    BE --> GM["Gemini 3.5 Flash-Lite (basic generation)"]
    BE --> GS["Google Search results via SerpApi"]
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
    participant GS as Google results via SerpApi

    FE->>API: POST /api/checks (text | url | images[])
    API->>API: validate + rate-limit + normalize + SHA-256
    API->>DB: cache lookup by content_hash
    alt cache hit (confirmed search, < 1 hour)
        API-->>FE: 200 {slug, status: COMPLETED}
    else miss
        API->>DB: insert check (PENDING)
        API-->>FE: 202 {slug, status: PENDING}
        S->>S: URL? fetch and extract article text
        S->>F: Optional claims:search (2s connect / 3s read timeout)
        S->>G: Prepare 1-2 search queries (text and images, no built-in tools)
        S->>GS: Google organic results (fresh search)
        S->>S: Deduplicate and fetch source pages with SSRF guard
        S->>G: Evaluate supplied evidence (JSON schema, no built-in tools)
        S->>S: Require completed report with citations limited to Google results
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


# Backlog

## Phase 0 — Foundation
- [x] Monorepo, git, GitHub
- [x] Postgres 18 via Docker Compose
- [x] Backend skeleton + Spotless
- [x] Frontend skeleton + Tailwind v4 + shadcn + Oxlint + Vitest
- [x] AGENTS.md, rules, docs
- [x] Pre-commit hooks
- [x] CI

## Phase 1 — Text check MVP
- [x] Flyway V1 schema + Check entity/repository
- [x] POST /api/checks (text) + GET /api/checks/{slug}
- [x] Async worker + Gemini claim extraction + verification
- [x] OpenAPI → TypeScript client generation
- [x] CheckPage + ResultPage with polling

## Phase 2 — Evidence & Fact Check Tools API
- [x] Google Fact Check Tools API client (`claims:search`)
- [x] Combine existing human fact-checks with Gemini + Google Search grounding
- [x] Source credibility & confidence meter UI
- [x] Shareable result link copy button & metadata

## Phase 3 — Images + URL Extraction
- [x] URL article extractor (`Jsoup` + SSRF private-IP guard)
- [x] Multimodal image upload (`multipart/form-data`, max 4 × 5 MB, JPEG/PNG/WebP magic-byte check)
- [x] Gemini multimodal claim extraction & verification (text + URL + images)
- [x] Frontend `InputTabs` (Text / URL / Images) & `ImageDropzone` (drag-drop + clipboard paste)

## Phase 4 — Hardening
- [x] Per-IP rate limiting on `POST /api/checks` (10 checks/hour, `429` + `Retry-After`)
- [x] CORS configuration (`veryfact.cors.allowed-origins`)
- [x] Frontend `429` rate-limit feedback
- [x] Rate-limiter unit tests

## Phase 5 — Deploy-ready
- [x] Backend multi-stage `Dockerfile` (Eclipse Temurin 25 JRE + non-root user)
- [x] Frontend multi-stage `Dockerfile` + `nginx.conf` (SPA fallback + `/api` reverse proxy)
- [x] Full-stack `docker-compose.yml` (`postgres`, `backend`, `frontend` with healthchecks)
- [x] Root `README.md` with architecture, setup, and AI workflow documentation

## UI Redesign & Cloud Deployment
- [x] Modern UI redesign (Truth-desk dot matrix, real thumbnail previews, character ring meter, animated verdict stamp)
- [x] Cloud datasource & dynamic `$PORT` binding for containerized PaaS (Render, Railway, Fly.io)
- [x] Step-by-step Cloud Deployment Guide (`docs/DEPLOYMENT.md`)
- [x] Recent checks community feed (`GET /api/checks/recent` + home page cards)

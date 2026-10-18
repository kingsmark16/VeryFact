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
- [ ] URL article extractor (`Jsoup` + SSRF private-IP guard)
- [ ] Multimodal image upload (`multipart/form-data`, max 4 × 5 MB, JPEG/PNG/WebP magic-byte check)
- [ ] Gemini multimodal claim extraction & verification (text + URL + images)
- [ ] Frontend `InputTabs` (Text / URL / Images) & `ImageDropzone` (drag-drop + clipboard paste)

## Phase 4 — Hardening · Phase 5 — Deploy-ready
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

## Verification speed and live-search correctness
- [x] Remove ungrounded retries and fabricated demo verdicts
- [x] Require Google Search execution evidence before completing a check
- [x] Reuse Gemini client, lower thinking effort, and bound optional fact-check lookups
- [x] Restrict cache reuse to confirmed-search results less than one hour old
- [x] Replace fixed loading percentage with stage count and add regression tests
- [x] Enforce a 60-second Gemini deadline and expire abandoned checks after five minutes
- [x] Make optional Fact Check credentials explicit instead of reusing the Gemini key
- [ ] Deploy updated backend/frontend and measure live latency and citation quality

## Gemini 2.5 free-tier search compatibility
- [x] Support optional gemini-2.5-flash-lite with thinkingBudget instead of thinkingLevel
- [x] Use generateContent with Google Search and locally validate prompted JSON reports
- [x] Require search queries, web-source metadata, and a completed response
- [x] Add mocked compatibility tests for images, grounding, truncation, and malformed reports
- [x] Surface model-unavailable errors separately from quota and generic failures
- [ ] Enable live verification: current project rejects Gemini 2.5 as unavailable to new users; Gemini 3 Search requires eligible API billing

## Free Google results via SerpApi
- [x] Add Google organic search retrieval with a separately configured SerpApi free key
- [x] Use tool-free Gemini 3.5 Flash-Lite for query planning and evidence evaluation
- [x] Fetch source pages through the SSRF guard and restrict citations to retrieved Google results
- [x] Handle missing keys, empty results, provider limits, and invalid citations without paid fallbacks
- [x] Verify the configured SerpApi account is Free Plan and complete a local live check (about 9.4s)
- [ ] Deploy this configuration to the hosted backend, if used

## Clean editorial UI redesign
- [x] Simplify the home page around one checking form with restrained colors and typography
- [x] Remove terminal/version labels, technical provider copy, character-ring decoration, and repeated feed metadata
- [x] Add keyboard-operable input tabs, optional context disclosure, and a public-content notice
- [x] Separate claim text from optional context and validate article URL structure
- [x] Refine report surfaces, verdict contrast, filter controls, and source wrapping
- [x] Add English and Filipino translation resources for redesigned interface copy
- [x] Verify frontend checks and desktop/mobile browser layouts
- [x] Complete backend packaging verification after restarting the local backend to release its JAR

## Verification failure investigation
- [x] Reproduce the reported failure path using the saved excerpt and the exact text supplied by the user; both fresh checks completed after backend restart
- [x] Add fixed diagnostic reason codes for invalid plans, incomplete reports, and citation validation failures without logging submitted content or provider messages
- [x] Add regression coverage ensuring unknown diagnostic messages remain private
- [x] Run backend verification and frontend checks, and restore the local backend
- Original failed report remains FAILED; its earlier exception log lacks a reason, so the precise original cause is unconfirmed

## Interactive loading and evidence-first reports
- [x] Replace synthetic progress percentages with actual server stages and a document-scan animation
- [x] Add clickable stage explanations and an animation pause control independent of verification
- [x] Redesign results with a prominent verdict, unique-source counts, and a confidence explanation
- [x] Add numbered claims, collapsible evidence/submission sections, and complete verdict-category filters
- [x] Localize the loading/report experience in English and Filipino
- [x] Add tests for stage exploration, pause/resume, report transitions, filters, and clipboard failures
- [x] Check responsive layouts, dark styling, keyboard interactions, and reduced motion

## Number formatting
- [x] Remove leading-zero padding from homepage steps, claim/source numbers, and report counts; retain this preference in frontend conventions

## Homepage alignment
- [x] Center the headline and checker as one group below the navigation; compact the form on shorter desktop viewports while preserving natural mobile scrolling

## Focused live loading state
- [x] Center the loading state below navigation and replace the step console with an orbital animation
- [x] Remove repeated process lists, stage counts, explanatory panels, and tips; show only the current server-reported activity
- [x] Keep animation pausing and reduced-motion support independent of live status updates

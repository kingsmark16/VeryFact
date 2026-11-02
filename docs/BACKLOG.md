# VeryFact — Backlog and delivery status

Last synchronized with the repository: 2026-11-02. Checked items describe code in
this repository; they do not prove that a hosted environment runs that code.
Historical provider-account observations are recorded in ADRs, not deployment guarantees.

## Foundation and quality

- [x] Monorepo with backend/frontend, shared OpenAPI artifacts, agent rules, and ADRs.
- [x] Spring Boot 4.1.1 / Java 25, Maven wrapper, Spotless, JPA, Flyway V1 schema.
- [x] PostgreSQL 18 local Compose service and persistent volume.
- [x] React 19 / Vite 8 / TypeScript 6, Tailwind v4, shadcn/Base UI, Oxlint, Prettier, Vitest.
- [x] Husky/lint-staged hooks and separate backend/frontend CI check jobs.
- [x] Integration-test OpenAPI export and frontend schema-generation command.
- [ ] Add an explicit CI generated-contract drift check; current jobs do not compare artifacts.
- [ ] Pin Testcontainers PostgreSQL to the intended production major version; tests currently use `postgres:latest`.

## Submission, persistence, and API

- [x] JSON text submission and multipart text/URL/images; backend validation and public report retrieval.
- [x] Text bounds, four-image limit, 5 MiB/image, supported MIME/signature validation, image previews/drop/paste.
- [x] SSRF-protected article extraction with redirect validation and bounded size/time.
- [x] Failed direct article extraction continues with URL/context rather than invented article text.
- [x] Public `/r/:slug` reports and `GET /api/checks/recent` (up to six completed reports with verdicts).
- [x] Store public excerpts, URLs, hashes, result JSON, status, timestamps, and provenance; no stored image bytes/IPs.
- [x] Reuse matching completed reports created within one hour only with `-search-v1` provenance.
- [x] Async worker stages, safe failure messages, and cleanup of unfinished work older than five minutes.
- [x] Fixed-window in-memory submission limiting, default 10/hour, `429` and `Retry-After`.
- [x] Configurable CORS and frontend retry-delay feedback.

## Verification and evidence

- [x] Optional Google Fact Check Tools lookup with explicit credentials and bounded HTTP timeouts.
- [x] Default SerpApi Google organic retrieval with one/two Gemini-planned queries and tool-free evidence evaluation.
- [x] Fetch up to three evidence pages through the SSRF guard and distinguish snippets from fetched text.
- [x] Validate default-path citations against exact retrieved Google-result URLs; reject invented citations.
- [x] Explicit native Gemini Search route, including Gemini 2.5 compatibility for accounts with access.
- [x] Remove demo verdicts, ungrounded retries, silent provider/model fallback, and unsafe provider-error logging.
- [x] Reused Gemini client, LOW thinking for Gemini 3, configurable 60-second default AI deadline (maximum 120 seconds).
- [x] Mocked provider, timeout, malformed-output, search-evidence, quota, and citation regression tests.
- [x] Earlier local live SerpApi check recorded in ADR 0004; one sample is not a latency/accuracy guarantee.
- [ ] Deploy the current backend/frontend configuration to the intended host and verify real provider access, representative latency, and citation relevance.

## Current interface

- [x] Editorial homepage with centered headline/form, optional context, separate mode drafts, and public-content notice.
- [x] Custom `Icon.png` navigation logo/favicon and locally bundled Inter typography.
- [x] Up to three recent report cards; hide the section when no recent results are available.
- [x] Actual-stage orbital loading state, animation pause/resume, status announcements, and reduced motion.
- [x] Evidence-first report: overall verdict/summary, claim and unique-source counts, confidence explanation, notes, submitted excerpt.
- [x] Numbered claim evidence, expanded-by-default safe links, published fact-check links, and empty evidence states.
- [x] Supported/disputed/uncertain filters preserve original claim numbering.
- [x] Clipboard sharing and manual-copy guidance on failure; report headers omit slug/model badges.
- [x] Top-scroll before completed/failed report display and accessible verdict focus without additional scrolling.
- [x] Preserve scroll during filtering and same-state completed-report refreshes.
- [x] English/Filipino UI resources; initialization is English with no language selector.
- [x] Counts without leading-zero padding; responsive styles, keyboard interaction, and relevant regression tests.

Earlier terminal styling, character-ring decoration, verdict stamp, stage counts,
clickable stage explanations, and document-scan loading were replaced. They are
historical designs, not additional current features; see ADRs 0005 and 0006.

## Packaging and deployment gaps

- [x] Backend Java 25 multi-stage image with non-root runtime user.
- [x] Frontend Node 24 build/Nginx image with SPA fallback and Compose-specific API proxy.
- [x] Full-stack Compose profile; database healthcheck and startup dependency ordering.
- [x] Configurable JDBC datasource, backend `PORT`, frontend build-time API origin, and hosting guidance.
- [ ] Synchronize base Compose's model fallback with Spring/`.env.example` and forward SerpApi/provider/deadline/rate-limit settings. The deployment guide supplies an override until implementation changes.
- [ ] Verify remote-address behavior and rate limiting behind the target hosting proxy; current state is process-local and uses the servlet remote address.
- [ ] Verify frontend/backend readiness and reverse-proxy timeout behavior in the target host; only the database has a Compose healthcheck.

## Documentation synchronization

- [x] Audit recent commits against controllers, services, AI/search clients, frontend pages/tests, configuration, and CI.
- [x] Replace template frontend/backend guides with project-specific setup and implementation references.
- [x] Synchronize README, product specification, architecture, deployment guide, contributor instructions, and folder rules.
- [x] Correct privacy/storage, source fields, API coverage, model defaults, rate-limiter implementation, localization limits, and container instructions.
- [x] Mark superseded ADR behavior and preserve historical account/validation observations as history.

No report deletion/retention management, private accounts/reports, durable worker
queue, shared multi-instance rate limiter, or interface language selector is
implemented. These are limitations, not committed roadmap items. The original
failed-report investigation remains inconclusive for its historical exception;
current safe diagnostic reason codes improve future investigation.

## Documentation-audit validation (2026-11-02)

- Frontend `npm run check`: passed, including 20 tests and the production build.
- Backend `.\mvnw.cmd verify`: all 52 tests passed; full verification then failed
  during Spring Boot repackaging because the existing output JAR could not be renamed
  (Windows file lock). This is a packaging/environment blocker, not a passing full build.
- Java `spotless:check`, changed-document Prettier checks, local Markdown link checks, and `git diff --check`: passed.
- Existing frontend lint/build warnings remain: Fast Refresh exports in UI primitives
  and a production chunk above the configured size warning threshold.
- No application behavior, API DTOs, or generated contracts were intentionally changed.

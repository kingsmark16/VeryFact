# File and folder structure

## Backend — package by feature

Under `backend/src/main/java/com/veryfact/`:

- `config/`: `AsyncConfig` (async/scheduling/properties), `WebConfig` (CORS),
  `RateLimitFilter` and `RateLimitProperties`.
- `common/exception/`: domain exceptions and `GlobalExceptionHandler` (ProblemDetail).
- `common/util/`: content hashing, slug generation, and image validation.
- `check/`: `CheckController`, `CheckService`, `CheckWorker`, `CheckRecovery`,
  `domain/` entities/repository/enums, and record `dto/` types.
- `ai/`: `FactCheckAi`, `GoogleSearchFactCheckAi` (default), `GeminiFactCheckAi`
  (native grounding/shared client), model settings, deadlines, and prompt templates.
- `search/`: SerpApi client, provider settings, and safe search exceptions.
- `factcheck/`: optional Google Fact Check Tools client/settings.
- `extractor/`: URL article extraction and SSRF protection.

Tests in `backend/src/test/java/com/veryfact/` mirror the packages. Flyway migrations
live in `backend/src/main/resources/db/migration/`.

## Frontend — feature-based structure

Under `frontend/src/`:

- `app/`: Query provider and React Router route setup.
- `api/`: shared Axios client/error handling and generated `schema.d.ts`.
- `components/ui/`: shadcn/Base UI primitives.
- `components/layout/`: shared `Navbar` and `Footer`.
- `features/check/api/`: Axios request hooks and aliases from generated schemas.
- `features/check/pages/`: homepage, report, and not-found pages with colocated tests.
- `features/check/components/`: image input, orbital loading, evidence cards,
  verdict badges, and sharing, with colocated tests.
- `features/check/report-copy.ts`: English/Filipino loading/report resources.
- `lib/`: shared utilities and i18n initialization/homepage resources.
- `test/`: shared Vitest setup; `index.css`: shared styling and motion rules.

Create additional shared hooks or feature subfolders when needed; do not assume
planned `hooks/`, `types/`, or `__tests__/` folders already exist.

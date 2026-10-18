# File & Folder Structure Rules (Always Apply)

## Backend (`backend/src/main/java/com/veryfact/`) — Package-by-Feature
- `config/`: Cross-cutting Spring `@Configuration` classes (`AsyncConfig`, `CorsConfig`, `OpenApiConfig`).
- `common/exception/`: `ApiException`, domain exceptions, and `GlobalExceptionHandler` returning RFC 9457 `ProblemDetail`.
- `common/util/`: Pure stateless utilities (`ContentHasher`, `SlugGenerator`).
- `check/`: Fact-check feature (`CheckController`, `CheckService`, `CheckWorker`, `domain/`, `dto/`).
- `ai/`: `FactCheckAi` interface, `GeminiFactCheckAi`, `GeminiProperties`, `PromptTemplates`.
- `factcheck/`: Google Fact Check Tools API client and models.
- `extraction/`: URL article extraction + SSRF protection.
- `ratelimit/`: Per-IP rate limiting filter.
- `src/test/java/com/veryfact/`: Mirrors `src/main/java` package structure exactly.

## Frontend (`frontend/src/`) — Feature-Based Structure
- `app/`: App-wide setup (`providers.tsx` for TanStack Query, `router.tsx` for React Router).
- `api/`: Shared `axios-client.ts` (with `ProblemDetail` error interceptor) and generated `schema.d.ts`.
- `components/ui/`: shadcn/ui primitives only.
- `components/layout/`: Shared layout components (`Header`, `Footer`, `DisclaimerBanner`).
- `features/<feature>/`: Self-contained domain modules:
  - `api/`: Axios request functions + TanStack Query hooks (`useQuery`, `useMutation`)
  - `components/`: Feature-specific UI components
  - `pages/`: Route page components
  - `types/`: Feature types derived from `schema.d.ts`
  - `__tests__/`: Feature tests
- `hooks/`: Shared custom hooks.
- `lib/`: Pure utilities (`utils.ts`).
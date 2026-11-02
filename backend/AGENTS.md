# Backend conventions

- Package by feature under `com.veryfact`: `check`, `ai`, `search`, `factcheck`,
  `extractor`, `config`, and `common`. See the root architecture guide for ownership.
- DTOs are Java records. Use constructor injection, never field `@Autowired`.
- Prefer `@ConfigurationProperties` records for settings; existing CORS uses `WebConfig`
  and `@Value`. Never hard-code API keys. Keep defaults/documentation synchronized.
- Map synchronous domain/validation exceptions to RFC 9457 `ProblemDetail` in
  `GlobalExceptionHandler`. Async verification failures are saved as failed reports.
- Depend on `FactCheckAi` for verification. External HTTP clients must remain mockable;
  tests use mocks/WireMock-style interception, never live provider calls.
- Default search is SerpApi plus tool-free Gemini evaluation. Native Gemini Search is
  explicitly configurable. Never add ungrounded retries or fabricated fallback reports.
- Schema changes require a new Flyway migration in
  `src/main/resources/db/migration/V{n}__description.sql`.
- Public excerpts and reports are stored; image bytes and client IPs must not be.
  Keep logs limited to safe IDs, exception types, and allowlisted diagnostic reasons.
- API changes require generated OpenAPI/TypeScript synchronization and tests. See
  `.agents/rules/` and `README.md` in the repository root for required checks.

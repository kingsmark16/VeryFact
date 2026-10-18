# Backend conventions
- Package by feature under com.veryfact: check, ai, factcheck, extraction, ratelimit, common.
- DTOs are Java records. Constructor injection only (no field @Autowired).
- Config via @ConfigurationProperties records, never hard-coded values or keys.
- Errors: throw domain exceptions, map them in GlobalExceptionHandler to ProblemDetail (RFC 9457).
- External services (Gemini, Fact Check API, HTTP fetching) sit behind interfaces so tests can mock them.
- Schema changes only via new Flyway files: src/main/resources/db/migration/V{n}__description.sql.
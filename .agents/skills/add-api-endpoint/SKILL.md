---
name: add-api-endpoint
description: Add a new REST endpoint to the VeryFact backend following project conventions. Use when asked to add or change an API endpoint.
---

# Add an API endpoint

1. Read `.agents/rules/api-contract.md` and `.agents/rules/security-privacy.md`.
2. Create request/response DTO records in `check/dto/` (or the feature's `dto/`), with Bean Validation annotations.
3. Put logic in the feature's `*Service`; the controller stays thin and never returns entities.
4. Throw `ResourceNotFoundException` or add a handler in `GlobalExceptionHandler` (RFC 9457 `ProblemDetail`); never leak stack traces.
5. Add a service unit test and a `@WebMvcTest` controller test in `src/test/java`.
6. Run `cd backend; .\mvnw.cmd spotless:apply; .\mvnw.cmd verify`.
7. Follow the `sync-api-contract` skill to regenerate the TypeScript types.
8. Update `docs/BACKLOG.md`.
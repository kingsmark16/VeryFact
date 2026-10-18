# API contract (always apply)
- The Spring Boot OpenAPI spec is the source of truth for the HTTP API.
- contracts/openapi.json and frontend/src/api/schema.d.ts are GENERATED — never edit them by hand.
- After changing a controller or DTO, regenerate both and commit them in the same change.
- Errors are application/problem+json (ProblemDetail).
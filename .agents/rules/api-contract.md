# API contract (always apply)

- Spring-generated OpenAPI is the source of truth for the HTTP API.
- `contracts/openapi.json` and `frontend/src/api/schema.d.ts` are generated; never
  edit them by hand. Axios request functions/hooks are handwritten and typed from
  the generated schemas.
- After changing controllers/DTOs, export OpenAPI using `BackendApplicationTests`,
  regenerate schemas with `npm run gen:api`, format, and commit both artifacts.
- Synchronous API errors use `application/problem+json` (ProblemDetail).
  Asynchronous verification failures are saved as failed check reports; retrieving
  an existing failed report returns `200` with failure status/error data.
- Run both full verification commands. Current CI does not separately enforce
  generated-artifact drift; do not assume it will detect a missed regeneration.

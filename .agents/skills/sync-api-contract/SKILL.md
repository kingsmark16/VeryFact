---
name: sync-api-contract
description: Regenerate contracts/openapi.json and the frontend TypeScript types after any backend API change.
---

# Sync the API contract

1. `cd backend; .\mvnw.cmd test -Dtest=BackendApplicationTests` (writes `contracts/openapi.json`).
2. `cd frontend; npm run gen:api; npm run format`.
3. `npm run typecheck`, then fix any frontend code broken by the type changes.
4. Never hand-edit `frontend/src/api/schema.d.ts`; commit it together with `contracts/openapi.json`.
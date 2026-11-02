# VeryFact frontend

React 19, Vite 8, TypeScript 6, Tailwind CSS v4, shadcn/Base UI, TanStack Query, Axios, and i18next. See the [product specification](../docs/PRODUCT_SPEC.md) for the current user experience.

## Run and check

Use Node.js 24. Start the database/backend as described in the [root README](../README.md), then run from this directory:

```powershell
npm ci
npm run dev
```

Vite serves the app on port 5173 and proxies `/api` to `http://localhost:8080`. To target a separate backend, set `VITE_API_BASE_URL` to its origin before starting/building. Request paths already include `/api`.

| Command                 | Purpose                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `npm run check`         | Oxlint, Prettier check, TypeScript, Vitest once, production build.                 |
| `npm run test`          | Vitest watch mode.                                                                 |
| `npm run test -- --run` | Single test run.                                                                   |
| `npm run format`        | Format files in the frontend directory.                                            |
| `npm run build`         | TypeScript build and Vite production bundle in `dist/`.                            |
| `npm run preview`       | Local production-bundle preview; it does not configure the dev server's API proxy. |
| `npm run gen:api`       | Generate `src/api/schema.d.ts` from `../contracts/openapi.json`.                   |

## Source map

- `app/router.tsx`: `/`, `/r/:slug`, and fallback routes; `providers.tsx`: Query client.
- `api/axios-client.ts`: base URL, 90-second request timeout, ProblemDetail/Retry-After handling. `schema.d.ts` is generated.
- `features/check/api/check-api.ts`: generated-schema-based types and handwritten Axios hooks. Text uses JSON; URL/images use multipart. Reports poll every 1.5 seconds until terminal status; recent queries stay fresh for 30 seconds.
- `features/check/pages/CheckPage.tsx`: mode drafts, validation, context disclosure, submission, up to three recent reports.
- `features/check/pages/ResultPage.tsx`: loading/error/report states, claim filters, safe source counts, scroll reset and accessible verdict focus.
- `features/check/components/`: orbital `ProgressSteps`, image input, claim evidence, verdict badges, sharing.
- `lib/i18n.ts` and `features/check/report-copy.ts`: English/Filipino resources; initialization is English with no language switcher.
- `components/layout/` and `components/ui/`: shared layout and UI primitives. `index.css`: editorial styling, responsive layout, dark-theme styles, reduced-motion behavior.

Tests live beside pages/components and use Vitest with Testing Library/jsdom. They cover form behavior, image input, actual-stage loading, animation pause, filtering, safe links, report scroll/focus, and clipboard failure. Tests do not replace browser accessibility/layout QA.

## API changes

Never hand-edit generated schemas or duplicate response DTOs. After a backend API change, export OpenAPI with `BackendApplicationTests`, then run `npm run gen:api`, format the generated file, and run the full check. See [architecture](../docs/ARCHITECTURE.md) and [contribution rules](AGENTS.md).

## Deployment

Build-time API origins and SPA rewrites matter for public report links. The stock Docker image serves Nginx on 80 and proxies `/api/` to Compose's `backend:8080`; it needs adaptation for separately hosted services. See the [deployment guide](../docs/DEPLOYMENT.md).

# Frontend conventions

- Feature folders: `src/features/<feature>/`, with API hooks, pages, components,
  and colocated tests. Keep shared setup in `src/app`, API infrastructure in
  `src/api`, and utilities/localization in `src/lib`.
- Function components and hooks. Server state uses TanStack Query; current forms
  use React state and explicit validation. Do not document uninstalled form libraries
  as existing dependencies.
- UI primitives come from shadcn/Base UI in `src/components/ui`; add through the
  shadcn CLI when needed and follow existing styles.
- User-facing interface strings go through i18next with English and Filipino
  resources (`src/lib/i18n.ts`, `src/features/check/report-copy.ts`). Current UI
  initializes in English; backend report/error text is not translated by the browser.
- Request functions/hooks use shared `src/api/axios-client.ts` and response types
  derived from generated `src/api/schema.d.ts`. The Axios wrappers are handwritten;
  never hand-edit generated schemas or duplicate response DTOs.
- Accessible by default: labels, keyboard support, visible focus, sufficient contrast,
  reduced-motion support, and status announcements.
- Loading shows actual server activity only. Animation pause must not pause polling.
  Preserve report top-scroll on terminal arrival and verdict focus without scrolling;
  filtering/refreshing the same completed report must preserve scroll.
- Display counts, step numbers, claim numbers, and source numbers without leading-zero
  padding (1, 2, 3; never 01, 02, 03).
- Use colocated Vitest/Testing Library tests. Run `npm run check` before delivery;
  use browser QA for material responsive/interaction changes.

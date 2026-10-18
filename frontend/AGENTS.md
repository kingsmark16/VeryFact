# Frontend conventions

- Feature folders: src/features/<feature>/ (components, hooks, tests together).
- Function components + hooks. Server state with TanStack Query; forms with react-hook-form + zod.
- UI from shadcn/ui (src/components/ui) — add with `npx shadcn@latest add <name>`.
- Every user-facing string goes through i18next with keys in both `en` and `fil`.
- API calls only through the generated typed client in src/api/ (never hand-write response types).
- Accessible by default: labels on inputs, keyboard support, sufficient contrast.

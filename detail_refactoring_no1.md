# Detail Refactoring Plan No.1

Purpose: prepare and sequence refactors for the current codebase while minimizing breakage.

## Snapshot (current state)
- Frontend: `src/` (Next 14; pages router). Key routes: auth (`signin.tsx`, `signup.tsx`, `Auth.tsx`), marketing (`Landing.tsx`, `index.tsx`), app (`dashboard.tsx`, `companies.tsx`, `companies/[id].tsx`, `CompanyDetail.tsx`, `CompanyResearch*.tsx`, `research/*`, `events.tsx`, `tasks.tsx`), error (`404.tsx`, `NotFound.tsx`), catch-all API `src/pages/api/[[...slug]].ts`.
- Shell/providers: `src/pages/_app.tsx` (providers/layout), `src/App.tsx` (standalone shell), theme context `src/contexts/ThemeContext.tsx`.
- Components: `src/components/` (layouts, AI chat, map, research badge, dialog) and large shadcn kit under `src/components/ui/`.
- Hooks/utilities: `src/_core/hooks/useAuth.ts`, `src/hooks/*`, `src/lib/{firebase,trpc,utils}.ts`, constants `src/const.ts`.
- Backend: `server/` (TRPC/router setup in `_core`, tests, storage, db), entry `server/routers.ts`, helper `api/index.ts`.
- Data: Drizzle schema `drizzle/schema.ts`, relations, SQLs `drizzle/0002_company_researches.sql`, `0003_events_selection_steps.sql`, snapshots in `drizzle/meta/`, migrations folder empty.
- Shared: `shared/{const.ts,types.ts,_core/errors.ts}`.
- Build/output: `dist/` bundle and `dist/public/assets/*`; `public/` empty.
- Tooling: scripts in `package.json` (`dev`, `build`, `start`, `lint`, `check`, `format`, `test` via vitest, `db:push`), configs (`next.config.js`, `vite.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, `docker-compose.yml`, `vercel.json`, `postcss.config.cjs`, `components.json`), patches in `patches/`.

## Refactoring objectives (batch 1)
1) Entrypoint alignment: decide on single runtime surface (Next). Remove or integrate `src/App.tsx`; ensure `_app.tsx` owns providers, globals, and root layout.
2) Layout/routing consistency: unify dashboard/landing/auth under consistent layout; consolidate 404 handling between `404.tsx` and `NotFound.tsx`; standardize redirect/guard logic.
3) State/context hygiene: centralize theme/auth state, avoid duplicate auth handling between client (`useAuth`) and server (`firebaseSession`, `cookies`); strengthen typing and null-safety.
4) UI kit hardening: create a re-export barrel for `src/components/ui/`, drop unused kit pieces, and enforce consistent import paths.
5) Data/API boundary: document TRPC routers, ensure client types derive from server, and align `shared/types.ts` with router outputs; remove ad-hoc fetch helpers.
6) Build & ops hygiene: remove `dist/` from VCS, tighten `.gitignore`, ensure secrets (`.env`, Firebase JSON) excluded; document scripts and env contracts.
7) Database discipline: populate `drizzle/migrations/` with generated SQL, verify snapshots, and document migration flow.

## Detailed tasks
- Providers/layout
  - Inspect `src/pages/_app.tsx` providers (theme, query, TRPC, etc.), move any per-page wrappers into `_app` if global; delete redundant wrappers in pages.
  - Decide fate of `src/App.tsx` (delete or adapt as storybook/shell); update imports accordingly.
  - Ensure global styles live in `_app.tsx`/`index.css`; remove duplicate CSS imports in pages/components.
- Routing/UX
  - Pick one not-found implementation (`404.tsx` or `NotFound.tsx`), route all 404s to it; ensure API catch-all returns consistent error shape.
  - Normalize dashboard/landing/auth layout using `DashboardLayout` or a new shell; add guard for auth-required routes in one place.
- Auth/state
  - Extract auth service from `src/_core/hooks/useAuth.ts` into reusable module; type user/session; add loading/error states.
  - Map server-side auth (`server/_core/{firebaseSession,cookies,oauth}`) to client expectations; add shared types in `shared/types.ts`.
  - Consolidate theme handling in `ThemeContext`; remove duplicate theme logic in components.
- UI kit
  - Add `src/components/ui/index.ts` exports; run `rg` to update imports to barrel.
  - `rg` for unused UI components; delete unused files or mark TODO for removal.
  - Verify side-effect imports (CSS) remain intact after barrel change.
- Data/API boundary
  - Split `server/routers.ts` into feature routers if not already; document procedures and input/output zod schemas.
  - Ensure client TRPC instance (`src/lib/trpc.ts`) uses inferred types; add `shared/types.ts` entries where needed.
  - Remove or rewrite any axios/fetch calls that bypass TRPC unless justified.
- Database/migrations
  - Run Drizzle generate/migrate to populate `drizzle/migrations/` with SQL matching `drizzle/schema.ts` and snapshots.
  - Document migration order and rollback approach; ensure `db:push` script is correct.
- Build/secrets hygiene
  - Update `.gitignore` to exclude `dist/`, `.env`, `*.firebase*.json`, any local caches.
  - Remove committed `dist/` if safe; note impact on current deployments.
  - Add README section: scripts, env variables (names only, not values), patch usage, and dev vs prod run commands.

## Risks and cautions
- Auth/session spans client and server; changing one side without updating the other breaks login/guards.
- TRPC type inference can break if routers are reorganized without preserved exports.
- Shadcn kit uses side-effect CSS; barrel export must not drop required imports.
- Removing `dist/` could affect deployment if pipeline depends on committed artifacts.
- Firebase/OpenAI/AWS keys in `.env`/JSON must never be committed; handle with care.

## Suggested order of execution
1) Hygiene: `.gitignore`/secret handling, decide on `dist/`.
2) Entrypoint/layout: `_app.tsx` consolidation, `src/App.tsx` decision, 404 unification.
3) UI kit: barrel export + import rewrites; prune unused components.
4) Auth/state: extraction, typing, shared types.
5) API/data: router documentation and client alignment; remove stray fetches.
6) Database: generate/persist migrations, verify snapshots.
7) Docs: README updates (scripts/env/migrations/patched deps).

## Validation plan
- Tests: `pnpm test` (vitest). Add targeted tests for auth hooks/guards if missing.
- Type check: `pnpm check` (tsc --noEmit).
- Lint: `pnpm lint`.
- Manual smoke: sign-in/sign-up, dashboard load, company/research detail, not-found route, API catch-all behavior, theming toggle.
- Migration dry-run: run drizzle generate/migrate in dev; verify `drizzle/migrations/` contents match schema.

# System & Architecture Overview (StepNavi)

## High-level architecture
- **Frontend**: Next.js 14 (pages router) + React 19 + TypeScript 5.9. UI is built with Tailwind + shadcn/radix components and theming via `ThemeContext`.
- **Routing**: Next.js pages under `src/pages`. Navigation uses `wouter` with a Next-aware hook (`_app.tsx` wraps with a `Router` using a custom location hook).
- **State/queries**: React Query (`@tanstack/react-query`) + tRPC React client (`src/lib/trpc.ts`).
- **Backend**: Express app (`api/index.ts` → `server/_core/app.ts`) that mounts tRPC (`server/routers.ts`). Procedures are guarded via `publicProcedure` / `protectedProcedure` / `adminProcedure`.
- **Auth & session**:
  - OAuth via Manus WebDev (`server/_core/sdk.ts`, `server/_core/oauth.ts`) using `OAUTH_SERVER_URL`, `NEXT_PUBLIC_APP_ID`.
  - Session JWT stored in cookie `app_session_id` (see `shared/const.ts`, `server/_core/cookies.ts`).
  - Firebase client SDK for UI; Firebase Admin in the server for user lookup and Firestore access.
- **Data store**: Firestore via Firebase Admin. Data access lives in `server/db.ts` with helper functions for users, companies, tasks, notes, companyResearches, events, selectionSteps, students/roadmaps. Drizzle schemas in `drizzle/schema.ts` provide types/shape but runtime persistence is Firestore.
- **AI integration**:
  - Generic LLM client in `server/_core/llm.ts` (fetch-based). Supports Forge API or OpenAI (`OPENAI_API_KEY` + `OPENAI_BASE_URL`). `BUILT_IN_FORGE_API_KEY/URL` are primary; OpenAI vars act as fallback.
  - AI matching service `server/services/aiMatching.ts` builds a Japanese prompt and enforces JSON schema output for fit scoring (values/culture/skill/motivation, advice, strong/weak points).
- **Assets & storage**: Storage proxy helpers in `server/storage.ts` (Forge storage proxy, bearer auth).
- **Other utilities**: Data API helper (`server/_core/dataApi.ts`), map/image/voice helpers, notification sender.

## Frontend structure
- `src/pages/_app.tsx`: Global providers (tRPC client, QueryClient, ThemeProvider, Tooltip, Toaster) and wouter/Next router bridge.
- Key pages:
  - `Landing.tsx`: Marketing page.
  - `dashboard.tsx`: Main dashboard with stats, tasks, events, companies, roadmap widgets.
  - `companies`, `CompanyDetail.tsx`: CRUD and detail with notes and selection steps.
  - `research`: `CompanyResearch.tsx` (list), `CompanyResearchWizard.tsx` (wizard form), `CompanyResearchDetail.tsx` (detail + AI matching panel).
  - `MyProfile.tsx` + `profile.tsx`: Profile editor persisted to Firestore via tRPC (`profile.get/save`). Exporter converts to AI matching profile (`src/lib/aiMatching.ts`).
  - Auth pages (`signin.tsx`, `signup.tsx`, `Auth.tsx`), home/404.
- Components: shadcn UI in `src/components/ui/`, dashboards cards, status badges, AIChatBox demo, StudentRoadmapCard, DashboardLayout, ErrorBoundary, etc.
- Styling: Tailwind via `index.css`, gradients/blur backgrounds, dark mode supported.

## Backend (tRPC) structure
- Entrypoint: `api/index.ts` → `configureApp` (JSON body parser, OAuth route, Firebase session route, tRPC at `/api/trpc`).
- Router (`server/routers.ts`):
  - `system`: health/status, notifyOwner.
  - `auth`: `me`, `logout`.
  - `companies`: list/get/create/update/delete.
  - `tasks`, `notes`, `events`, `selectionSteps`: CRUD and list helpers.
  - `companyResearches`: list/get/create/update/delete + getByCompanyId.
  - `students`: listWithRoadmap (with fallback data).
  - `dashboard`: stats (aggregates companies/tasks).
  - `ai.matchProfileToCompany`: runs AI matching using saved profile payload against a company research record.
- Context (`server/_core/context.ts`): attaches authenticated user via `sdk.authenticateRequest`.
- Auth SDK (`server/_core/sdk.ts`): OAuth token exchange, user info fetching, JWT session sign/verify, cookie parsing, owner/admin checks.
- LLM client (`server/_core/llm.ts`):
  - Normalizes messages/tools/response formats.
  - Resolves API URL/model; omits `thinking` payload when targeting OpenAI.
  - Uses bearer token from env; throws if key missing.

## Data model (logical)
- Users: `users` collection (FireStore), id via `_meta.counters`.
- Companies: basic info, status, priority, nextStep/deadline, memo, tags.
- Tasks: title, companyId?, dueDate, status.
- Notes: company-linked notes (interview/ES/other).
- CompanyResearch: Q&A fields q1–q14, status, company linkage.
- Events: calendar items with remind options.
- SelectionSteps: per-company selection pipeline with statuses and ordering.
- Students/Roadmaps: definition/steps/instances, with fallback data generator.

## Configuration & env
- Major vars (see `.env`):
  - Database URL (MySQL string unused at runtime, Firestore is primary).
  - OAuth/owner IDs; JWT secret.
  - Firebase client and admin creds.
  - Storage/LLM: `BUILT_IN_FORGE_API_URL/KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` (without trailing `/v1`), optional `OPENAI_MODEL`.
- Cookies: `app_session_id`, `ONE_YEAR_MS` expiry helpers in `shared/const.ts`.

## Build & tooling
- Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm check` (tsc noEmit), `pnpm test` (vitest), `pnpm db:push` (drizzle generate + migrate).
- Type config: `tsconfig.json` uses `moduleResolution: bundler`, strict mode, paths `@/*` and `@shared/*`.
- Lint/test not run here; ensure Node+pnpm installed to execute.

## Data flows (key)
1) **Auth flow**: Frontend hits OAuth portal → redirect back `/api/oauth/callback` (handled in `server/_core/oauth.ts`); SDK fetches user info, upserts Firestore user, issues session JWT cookie.
2) **tRPC calls**: Frontend tRPC client (with credentials: include) → Express middleware → router procedures use `ctx.user` for scoping and Firestore queries in `server/db.ts`.
3) **AI matching**: Frontend `CompanyResearchDetail` fetches profile via tRPC (`profile.get`) → calls `ai.matchProfileToCompany` with converted profile + researchId → server builds prompt, calls LLM (`invokeLLM`), returns JSON result → UI renders scores/insights.
4) **Storage**: Optional uploads via `server/storage.ts` using Forge storage proxy (Bearer auth).

## Local persistence
- ブラウザキャッシュ/localStorageは不使用（プロフィールもサーバー保存）。

## Notable design choices
- Firestore used with numeric incremental IDs via `_meta/counters`.
- Drizzle schemas kept for type shape; actual persistence uses Firestore helpers.
- LLM client is provider-agnostic with schema-enforced JSON outputs for reliability.
- UI leans on gradients/blurred backgrounds and consistent badges/cards for dashboards and research flows.

## Detailed request lifecycle (typical page)
1) Browser loads a Next.js page (pages router). `_app.tsx` wraps the tree with React Query + tRPC providers and wouter router bound to Next navigation.
2) If user already has `app_session_id` cookie, tRPC requests include it (`credentials: "include"`). `sdk.authenticateRequest` verifies JWT, loads user from Firestore, and injects `ctx.user`.
3) Data fetching uses tRPC hooks; each procedure scopes queries by `userId` (e.g., `queryByUser` in `server/db.ts`). Returned objects are date-normalized to JS `Date`.
4) User actions (mutations) invalidate relevant queries via React Query’s `utils.*.invalidate` to refresh UI.

## Auth / session details
- OAuth via Manus WebDev: `exchangeCodeForToken` → `getUserInfo` → `upsertUser` (creates numeric id via `_meta.counters`) → `createSessionToken` signs JWT with `JWT_SECRET` → set cookie `app_session_id` (httpOnly, sameSite defaults in `getSessionCookieOptions`).
- Logout clears cookie with maxAge -1.
- Admin-only procedures check `user.role === "admin"` (owner openId grants admin at upsert).
- If auth fails, `ctx.user` is null; protected routes reject.

## Data access & consistency
- Firestore collections: `users`, `companies`, `tasks`, `notes`, `companyResearches`, `events`, `selectionSteps`, `students`, `roadmap*`, with `_meta/counters` for monotonic integer ids.
- `nextId` wraps counters in a Firestore transaction; other writes are simple set/update (no multi-collection transaction).
- Ownership: reads filtered by `userId`; updates/deletes assert ownership (`assertCompanyOwnership` for companies, explicit check for research/tasks/notes/events/steps).
- Timestamps normalized via `toDate`; `updatedAt` patched on writes.
- Sorting is performed in-memory after fetch (e.g., by `updatedAt`, `dueDate`), so large datasets could be expensive.
- Drizzle schema exists but runtime persistence is Firestore; `DATABASE_URL` is unused unless a future MySQL path is reactivated.

## AI stack details
- Client: `invokeLLM` builds payload, normalizes messages/tool_choice/response_format, and resolves endpoint/model:
  - URL: `BUILT_IN_FORGE_API_URL` > `OPENAI_BASE_URL` > default `https://api.openai.com/v1/chat/completions`.
  - Model: `BUILT_IN_FORGE_MODEL`/`OPENAI_MODEL` > if OpenAI URL then `gpt-4o-mini`, else `gemini-2.5-flash`.
  - Skips `thinking` payload when hitting OpenAI to avoid 400.
- AI matching service (`server/services/aiMatching.ts`):
  - Builds structured profile/company JSON (fills placeholders when missing).
  - Injects full Japanese prompt with strict JSON instructions and scoring rubric.
  - Requests `response_format: { type: "json_schema", strict: true }` using `aiMatchingResultJsonSchema`.
  - Parses `choices[0].message.content` as JSON and returns `AiMatchingResult`.
  - Any parse/HTTP errors throw up to tRPC layer.
- Front usage: `CompanyResearchDetail` uses `profile.get` result, converts to `MatchingProfile` via `src/lib/aiMatching.ts`, calls `ai.matchProfileToCompany`, and renders scores, badges, advice.

## Frontend UX & data binding
- Forms: `CompanyResearchWizard` uses `react-hook-form`, multi-section with required checks and toast errors. Saves/updates through tRPC mutations and invalidates list queries.
- Lists/detail pages: use `wouter` navigation, formatted dates via `date-fns` (`ja` locale), status badges via `CompanyResearchStatusBadge`.
- Profile editor: draft state is in-memory; saves go through tRPC to Firestore. No localStorage auto-save.
- Dashboard: aggregates companies/tasks/events via tRPC; computes counts and status breakdowns client-side.
- Styling: Tailwind utility classes + shadcn components, frequent gradient/blur backgrounds; dark mode via `ThemeProvider`.

## Environment resolution & fallbacks
- LLM: `forgeApiKey` from `BUILT_IN_FORGE_API_KEY` or `OPENAI_API_KEY`; URL from `BUILT_IN_FORGE_API_URL` or `OPENAI_BASE_URL` (should omit trailing `/v1`). Optional `OPENAI_MODEL` or `BUILT_IN_FORGE_MODEL` overrides default model selection.
- Firebase Admin: prefers `FIREBASE_ADMIN_CREDENTIALS` JSON or individual `FIREBASE_*` keys; client SDK uses `NEXT_PUBLIC_FIREBASE_*`.
- OAuth: `OAUTH_SERVER_URL`, `NEXT_PUBLIC_APP_ID`; falls back to local `/signin`/`/signup` if missing (see `src/const.ts`).
- JWT secret: `JWT_SECRET` (defaults to dev string if missing—secure in prod).

## Error handling & observability
- Errors surfaced through tRPC rejections; frontend shows toast messages (e.g., AI matching errors, form validation).
- Logging is mostly console-based (OAuth init, database fallback). No centralized telemetry or tracing.
- No global error recovery on frontend beyond `ErrorBoundary` wrapper.

## Gaps / risks to note
- Firestore operations are non-transactional across collections (except id counters); concurrent workflows could see stale derived fields.
- Type safety relies on inferred Drizzle types and manual casting in routers; some `any` casts exist (e.g., createCompany).
- Large list queries are unpaginated and sorted client-side; potential performance issues at scale.
- Tests and lint are available but not routinely run in this environment; Node/pnpm required to execute.

# AlumniConnect

A full-stack alumni social networking platform connecting students, graduates, and recruiters through a social feed, dual-mode messaging, careers portal, and admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/alumni-network run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query
- Auth: Clerk (Google + email; managed Replit tenant)
- API: Express 5 with Clerk middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (30+ endpoints)
- `lib/db/src/schema/` — DB schema files: profiles, posts, messages, careers, reports
- `lib/db/src/schema/index.ts` — exports all schema tables
- `lib/api-client-react/src/custom-fetch.ts` — fetch layer with Clerk token injection
- `artifacts/api-server/src/app.ts` — Express app with Clerk middleware
- `artifacts/api-server/src/routes/index.ts` — route mounting
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth middleware
- `artifacts/alumni-network/src/App.tsx` — main router with Clerk provider
- `artifacts/alumni-network/src/pages/` — all 10 pages
- `artifacts/alumni-network/src/components/` — layout + shadcn/ui components

## Architecture decisions

- Contract-first API: OpenAPI spec in `lib/api-spec` drives codegen for both React Query hooks and Zod validation schemas.
- Clerk auth proxy: frontend uses `publishableKeyFromHost` + `proxyUrl` so all auth traffic routes through the shared reverse proxy at `/`.
- `current_role` is a PostgreSQL reserved word — always double-quote it in raw SQL; Drizzle ORM handles it automatically.
- Anonymous messaging is first-class in the schema: `messages` table has `is_anonymous` boolean; the sender's identity is never sent to the recipient.
- Admin access is gated by `profiles.user_role = 'admin'` checked in a `requireAdmin` Express middleware.

## Product

- **Landing page** — marketing page for logged-out visitors with CTA
- **Social feed** — post creation, likes, comments, feed metrics sidebar
- **Profiles** — per-user profile page with edit form; onboarding modal for new users
- **Search / Network** — debounced search across alumni, students, recruiters with role filters
- **Messaging** — threaded conversations with Normal and Anonymous modes
- **Careers portal** — job listings + CV/resume browser; job creation for recruiters
- **Admin panel** — platform stats and user management (ban/unban), role=admin gated

## User preferences

- Monochrome design (black/white/gray only — no accent colors)
- Dual-mode messaging (normal + anonymous) is a key differentiator

## Gotchas

- Always double-quote `"current_role"` in raw SQL queries — it's a PostgreSQL reserved word.
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any change to `openapi.yaml`.
- Do not run `pnpm dev` at the workspace root — use individual workflow commands or `restart_workflow`.
- Orval naming: avoid duplicate `Params` types by keeping query params distinct across operations.
- Lib exports must be added to `lib/api-client-react/src/index.ts` manually after new functions are added to `custom-fetch.ts`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk configuration and customization

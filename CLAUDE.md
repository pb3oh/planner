# Planner — agent notes

This is **not** a typical Next.js 12/13 app. Read `node_modules/next/dist/docs/` (Next.js 16) before changing routing, `params`, or server APIs.

`params` in Route Handlers and server pages are **Promises** — await them. Prefer `src/proxy.ts` over deprecated `middleware.ts`.

## What this app is

Intake layer in front of a spec-driven build pipeline. Information architecture is three top-level tabs:

1. Requester submits a raw ask on **Request Work** (`/`)
2. LLM shapes an FR draft
3. Admin reviews in **Inbox** (`/inbox`; hidden from non-admins). Approve creates a plan `Item`. User management is a link inside Inbox (`/admin/users`).
4. **Plan** (`/plan` + `/plan/[id]`) is the hub: scoring, scheduling, AI evaluation, plus Phase 1 modules (spec interview → Definition-of-Ready gate → decompose → export). Cycle time is a Plan module, not a top-level tab.
5. Floating AI Planner chat bar on every authenticated page; `/api/chat` receives `{ pathname, page, itemId }` so replies can use the current view.

DoR, exporters, and cycle-time math are pure functions under `src/lib/` with Vitest coverage. Do not put Prisma inside those modules.

## Layout

```
src/app/            App Router pages + route handlers
src/components/     Nav, Wordmark, CLBar, Providers, HierarchyProvider, ui/*, plan/*, spec/*
src/hooks/          useHierarchy
src/lib/            prisma, auth, constants, utils, llm/
prisma/             schema + seed (generic sample data)
```

Chrome: stacked wordmark (`Planner` / `Dependency Planner` / `v3.0.0`), three nav pills, floating command-line chat. Stay company-neutral — do not use employer names.

## Conventions

- Existing pages (`inbox`, `plan`, `plan/[id]`, `admin/users`) use **inline styles** and a slate/blue palette. Match that when adding UI; do not restyle those screens.
- Client pages talk to `/api/*` with `fetch`. Keep JSON shapes the UI already expects (raw arrays for lists).
- Auth: NextAuth JWT + Credentials. `session.user` has `id`, `role`, `l0Ids`, `teamIds`. Inbox and `/admin` are admin-only (proxy + page + API).
- LLM: always `import { complete, taskTag, extractJson } from "@/lib/llm"`. Prefix system prompts with `taskTag("shape"|"evaluate"|"interview"|"decompose"|"chat")` so the mock provider can stay deterministic.
- Prisma 7 uses `@prisma/adapter-pg`. Instantiate through `src/lib/prisma.ts`.
- The floating chat input must keep class `cl-bar-input` (item detail focuses it).

## Inferred (missing from the original commit)

The original tree referenced files that were not uploaded. Reconstructions:

| Piece | Why we think it existed |
| --- | --- |
| `Nav`, `CLBar`, `Providers`, `HierarchyProvider` | imported from `layout.tsx` |
| `StatusPill`, `ScoreRing`, `L0Tag` | imported from plan pages |
| `src/lib/constants`, `utils`, `prisma` | imported from pages and API routes |
| `useHierarchy` | imported from plan pages |
| `/api/items`, `/api/drafts`, `/api/admin/users`, `/api/export`, NextAuth route | called from pages that *are* in the tree |
| `globals.css` | imported from layout; pages also expect `@keyframes pulse/spin` and `--font-sans` |
| Login + credentials | `useSession` / `session.user.role` without a shipped auth route; OAuth was not restorable without employer config |
| `/` Request Work | no `page.tsx` in the tree; inbox only *reviews* drafts. Nav label “Request Work” comes from the v3.0.0 portfolio screenshot (not the inferred “Submit”) |
| Approve → create `Item` | inbox approve/reject had no follow-on in source; promoting into the plan is the only way the flow is useful |
| HTML “Generate Slides” | `/api/export` is missing but the plan page expects `text/html` and `window.open` |
| `passwordHash` on `User` | required for credentials; original schema had Account/Session (OAuth-shaped) |
| Floating AI bar copy | portfolio screenshot: “Ask the AI Planner anything about the roadmap…” |

Do **not** add employer-specific names, sample data, or integrations.

## Commands

```bash
docker compose up -d db
npm run db:setup
npm run lint && npm run typecheck && npm test
```

Default LLM is mock. Anthropic is opt-in via env.

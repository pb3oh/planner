# Planner — agent notes

This is **not** a typical Next.js 12/13 app. Read `node_modules/next/dist/docs/` (Next.js 16) before changing routing, `params`, or server APIs.

`params` in Route Handlers and server pages are **Promises** — await them. Prefer `src/proxy.ts` over deprecated `middleware.ts`.

## What this app is

Intake layer in front of a spec-driven build pipeline:

1. Requester submits a raw ask (`/`)
2. LLM shapes an FR draft
3. Admin reviews in `/inbox` (approve creates a plan `Item`)
4. `/plan` + `/plan/[id]` for scoring, scheduling, AI evaluation
5. Spec interview → Definition-of-Ready gate → decompose into tasks → export (OpenSpec / Jira / Gherkin)
6. ItemEvent log → cycle time view

DoR, exporters, and cycle-time math are pure functions under `src/lib/` with Vitest coverage. Do not put Prisma inside those modules.

## Layout

```
src/app/            App Router pages + route handlers
src/components/     Nav, CLBar, Providers, HierarchyProvider, ui/*
src/hooks/          useHierarchy
src/lib/            prisma, auth, constants, utils, llm/
prisma/             schema + seed (generic sample data)
```

## Conventions

- Existing pages (`inbox`, `plan`, `plan/[id]`, `admin/users`) use **inline styles** and a slate/blue palette. Match that when adding UI; do not restyle those screens.
- Client pages talk to `/api/*` with `fetch`. Keep JSON shapes the UI already expects (raw arrays for lists).
- Auth: NextAuth JWT + Credentials. `session.user` has `id`, `role`, `l0Ids`, `teamIds`.
- LLM: always `import { complete, taskTag, extractJson } from "@/lib/llm"`. Prefix system prompts with `taskTag("shape"|"evaluate"|"interview"|"decompose"|"chat")` so the mock provider can stay deterministic.
- Prisma 7 uses `@prisma/adapter-pg`. Instantiate through `src/lib/prisma.ts`.

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
| `/` submit form | no page.tsx in the tree; inbox only *reviews* drafts, so intake had to live somewhere. Nav “Submit” is inferred |
| Approve → create `Item` | inbox approve/reject had no follow-on in source; promoting into the plan is the only way the flow is useful |
| HTML “Generate Slides” | `/api/export` is missing but the plan page expects `text/html` and `window.open` |
| `passwordHash` on `User` | required for credentials; original schema had Account/Session (OAuth-shaped) |

Do **not** add employer-specific names, sample data, or integrations.

## Commands

```bash
docker compose up -d db
npm run db:setup
npm run dev
npm run lint && npm run typecheck && npm test
```

Default LLM is mock. Anthropic is opt-in via env.

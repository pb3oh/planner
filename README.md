# Planner

Company-neutral prototype of an intake / planning front door: raw requests in, AI-shaped drafts, a review inbox, and a dependency plan.

This repo started as an incomplete Next.js 16 app (missing `src/lib`, components, hooks, and several API routes) with employer-specific sample data. Those pieces are restored here with generic fixtures. No real LLM key is required.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Prisma 7 + Postgres
- NextAuth credentials (local users, no OAuth)
- Pluggable LLM (`LLM_PROVIDER=mock|anthropic`), mock by default

## Information architecture (v3.0.0)

Three top-level tabs, matching the original chrome:

| Tab | Route | Who |
| --- | --- | --- |
| **Request Work** | `/` | Everyone — intake. AI shapes a raw ask into an FR draft. |
| **Plan** | `/plan`, `/plan/[id]` | Everyone — the hub. List + item. Phase 1 modules live here (spec, ACs, interview, DoR, tasks, exports, cycle time). |
| **Inbox** | `/inbox` | Admins only — approve/reject planner-app feature-request drafts. User management is a link inside Inbox (`/admin/users`), not a top-level tab. |

A persistent floating AI chat bar (“Ask the AI Planner anything about the roadmap…”) stays on every authenticated page and is sent the current page/item as context.

## Run locally

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in:

| Email | Password | Role |
| --- | --- | --- |
| `alex.admin@example.com` | `password123` | super_admin |
| `morgan.pm@example.com` | `password123` | admin |
| `sam.dev@example.com` | `password123` | user |

### LLM

- Default: `LLM_PROVIDER=mock` — deterministic, no network.
- Live model: set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:setup` | `prisma generate && db push && seed` |

## Phase 1 — spec front door (inside Plan)

On each plan item (`/plan/[id]`), below the original detail cards:

1. **Spec interview** — AI asks clarifying questions (`POST /api/specs/[id]/interview`). Mock: answer normally, or type `done` to fill a build-ready spec.
2. **Definition of Ready** — pure gate (`src/lib/gates/definitionOfReady.ts`). Handoff/decompose is blocked until problem, outcome, success metric, scope, non-goals, ACs, risks, and open questions pass.
3. **Decompose** — splits a ready spec into agent-sized tasks mapped to ACs.
4. **Export** — OpenSpec markdown, Jira CSV/JSON, Gherkin `.feature`.
5. **Cycle time** — ItemEvent status transitions, as a Plan list module and on the item.

See `CLAUDE.md` for architecture notes and what had to be inferred.

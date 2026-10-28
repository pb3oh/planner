# Planner

Company-neutral prototype of an intake / planning front door: raw requests in, AI-shaped drafts, a review inbox, and a dependency plan.

This repo started as an incomplete Next.js 16 app (missing `src/lib`, components, hooks, and several API routes) with employer-specific sample data. Those pieces are restored here with generic fixtures. No real LLM key is required.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Prisma 7 + Postgres
- NextAuth credentials (local users, no OAuth)
- Pluggable LLM (`LLM_PROVIDER=mock|anthropic`), mock by default

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

## Phase 1 — spec front door

On each plan item (`/plan/[id]`), below the original detail cards:

1. **Spec interview** — AI asks clarifying questions (`POST /api/specs/[id]/interview`). Mock: answer normally, or type `done` to fill a build-ready spec.
2. **Definition of Ready** — pure gate (`src/lib/gates/definitionOfReady.ts`). Handoff/decompose is blocked until problem, outcome, success metric, scope, non-goals, ACs, risks, and open questions pass. Missing checks render in the UI.
3. **Decompose** — splits a ready spec into agent-sized tasks mapped to ACs.
4. **Export** — OpenSpec markdown, Jira CSV/JSON, Gherkin `.feature`.
5. **Cycle time** (`/cycle-time`) — ItemEvent status transitions.

## Original screens (Phase 0)

These match the pages that shipped in the incomplete tree, plus the missing modules they imported:

- **Submit** (`/`) — inferred; the intake page that POSTs a raw request for AI shaping was not in the tree
- **Inbox** (`/inbox`) — FR draft review, approve/reject (admin)
- **Plan** (`/plan`) — ATL/BTL list, L0/L1/team filters, HTML slide export
- **Item detail** (`/plan/[id]`) — inline edit, AI evaluate, status/priority/effort
- **Users** (`/admin/users`) — role + L0/team assignment
- **Planning Advisor** — bottom chat bar (component was missing; class `cl-bar-input` is required by item detail)
- **Login** (`/login`) — inferred credentials screen replacing missing OAuth

See `CLAUDE.md` for architecture notes and what had to be inferred.

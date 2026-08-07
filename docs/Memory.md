# Memory — FounderPilot AI

> Purpose: running memory of what's actually been built, so a new chat/session with an
> AI coding tool doesn't have to re-read the whole codebase or guess at state. Update
> this after any real work session — append to the Progress Log, overwrite Current State.

## How to update this file
1. Append a new dated entry under "Progress Log" — don't rewrite history.
2. Overwrite "Current State" to reflect the latest truth.
3. If a decision changes the API contract, edit `Architecture.md` Section 4 in the same
   sitting and note the change here.

---

## Current State
- Phase reached: **Phase 5 complete** (frontend build) — Phase 6 (deploy) not started.
- Backend: fully implemented — `/health`, `/analyze`, `/chat`, `/metrics/{id}`,
  `/recommendations/{id}` all working per contract, with AI fallback/degradation handled.
- Frontend: fully implemented — Landing, Intake Form, Results (Dashboard/Insights/Chat
  tabs), 404. `npm run build` passes clean (TypeScript strict + Vite production build).
- Deployed URL: **none yet** — `render.yaml` is written and ready, but the repo hasn't
  been pushed to GitHub/connected to Render yet.
- Known issues / TODOs:
  - No `GET /analyze/{id}` endpoint — a hard refresh on `/results/:id` loses the AI-text
    fields (summary/risks/opportunities/action plan), since they only arrive via router
    state from the form's original POST response. Metrics/recommendations still refetch
    fine on refresh. Add this endpoint if persistent shareable result links are needed.
  - `XAI_API_KEY` not yet set anywhere — until it is (locally in `backend/.env`, or in
    the Render dashboard), every `/analyze` and `/chat` call runs in `ai_degraded: true`
    fallback mode. The app is fully functional this way, just with templated AI text.
  - No automated tests yet (manual verification only).

## Progress Log
- Initial hackathon docs (`PRD.md`/`Architecture.md`/`Rules.md`/`Phases.md`/`Design.md`)
  written as two parallel doc sets (person-a backend, person-b frontend) — since merged
  into this single `docs/` folder.
- Backend built against the contract: FastAPI skeleton, deterministic health-score
  engine, SQLite persistence, Grok AI client with retry + deterministic fallback, all
  four routers, shared error envelope.
- Frontend built from scratch against the same contract: full component set (score
  cards, Recharts charts, insight lists, action plan, chat window), dark/light theme,
  responsive layout, all loading/error/degraded states.
- Backend and frontend merged into one monorepo (`founderpilot-ai/`), duplicate docs/
  README/.gitignore/.env.example consolidated into single root files, `render.yaml`
  added for one-click Blueprint deploy of both services.

## Decisions made mid-build (not in the original docs)
- Tailwind v4 used (`@tailwindcss/vite` plugin) instead of v3 + PostCSS config — simpler
  setup, same utility classes, tokens defined via `@theme` + CSS custom properties in
  `index.css` rather than `tailwind.config.js`.
- shadcn/ui was specified in the original frontend docs but not used — custom Tailwind
  components were built directly instead to avoid the extra dependency/setup weight for
  a project this size. Swap in shadcn later if the component surface area grows a lot.
- `analysis_id`'s full result payload travels via React Router state, not a global
  store — acceptable per the "no Redux" rule, but means refresh loses the AI-text
  fields (see Current State TODOs above).

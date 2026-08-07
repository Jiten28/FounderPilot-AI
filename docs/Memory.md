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
- Phase reached: **Phase 5 complete** (frontend build), plus the `GET /analyze/{id}`
  endpoint and the Groq migration below. Phase 6 (deploy) not started.
- AI provider: **Groq**, not xAI/Grok (switched — see Progress Log). Backend calls
  `https://api.groq.com/openai/v1/chat/completions` via `GROQ_API_KEY`/`GROQ_MODEL`
  (default `llama-3.3-70b-versatile`)/`GROQ_TIMEOUT_SECONDS`.
- Backend: fully implemented — `/health`, `/analyze` (POST + new GET `/analyze/{id}`),
  `/chat`, `/metrics/{id}`, `/recommendations/{id}` all working per contract, with AI
  fallback/degradation handled.
- Frontend: fully implemented — Landing, Intake Form, Results (Dashboard/Insights/Chat
  tabs), 404. `Results.tsx` now fetches the analysis via `GET /analyze/{id}` on mount
  when router state is missing (hard refresh), instead of showing a hard "start over"
  error. `tsc -b` passes clean (Vite build itself untested in the sandbox that produced
  this note — see Progress Log entry below — verify `npm run build` end-to-end on your
  machine).
- Deployed URL: **none yet** — `render.yaml` is written and ready (now referencing
  `GROQ_API_KEY`), but the repo hasn't been pushed to GitHub/connected to Render yet.
- Local run: confirmed working on Windows (PowerShell) after the `backend/.env` fix
  below — `uvicorn app.main:app --reload` boots clean once `backend/.env` and
  `frontend/.env` are kept separate (each with only its own variables).
- Known issues / TODOs:
  - `GROQ_API_KEY` is currently **blank** in `backend/.env` (the old `XAI_API_KEY` value
    was left behind, unused, when the provider switched — that key doesn't work against
    Groq's API anyway). Get a free key at console.groq.com/keys and set it locally and
    in the Render dashboard before demoing, or every `/analyze`/`/chat` call stays in
    `ai_degraded: true` fallback mode. The app is fully functional this way, just with
    templated AI text.
  - No automated tests yet (manual verification only).

## Progress Log
- **Debugged the "chat always fails / dashboard shows degraded fallback" report**: root
  cause was every xAI Grok call failing (traced to the exact fallback string in
  `ai_client.py`'s `get_chat_reply` except block, and the deterministic-template text
  showing verbatim in the dashboard's business_summary). The `XAI_API_KEY` present in
  `backend/.env` wasn't diagnosed further (no network access from the debugging
  environment) — moot anyway since the provider was switched.
- **Switched AI provider from xAI Grok to Groq** (free tier): renamed
  `XAI_API_KEY`→`GROQ_API_KEY`, `GROK_MODEL`→`GROQ_MODEL` (default now
  `llama-3.3-70b-versatile`), `GROK_TIMEOUT_SECONDS`→`GROQ_TIMEOUT_SECONDS` throughout
  `config.py`, `ai_client.py`, both `.env` files, `render.yaml`, `README.md`, and
  `docs/Rules.md`/`Architecture.md`/`PRD.md`. `GROQ_API_KEY` is currently blank — needs
  a real key before AI features come out of fallback mode (see Known issues above).
- **Added `GET /analyze/{analysis_id}`** (backend `routers/analyze.py`, factored the
  record→response mapping into `_record_to_result()` shared with `POST /analyze`).
  Updated `Architecture.md` (new Section 4.1b, rewrote the old "known limitation"
  paragraph in Section 3) and `PRD.md`'s non-goals bullet to match. Frontend
  `Results.tsx` now calls this on mount (via new `getAnalysis()` in `api/client.ts`)
  whenever router state is missing, so a hard refresh on `/results/:id` recovers the
  full analysis instead of forcing a restart.
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
- Fixed a local-run crash: `backend/app/config.py`'s `Settings` class rejected any
  `.env` file that also contained frontend variables (e.g. `VITE_API_BASE_URL`) with a
  Pydantic `extra_forbidden` error, because the single root `.env.example` made it easy
  to copy the whole file into `backend/.env` without trimming. Added
  `extra="ignore"` to `SettingsConfigDict` so stray/unrelated vars are silently ignored
  instead of crashing the server. Also rewrote the README's local-run steps to give the
  exact minimal `.env` content per app instead of a "copy then trim" instruction.

## Decisions made mid-build (not in the original docs)
- Tailwind v4 used (`@tailwindcss/vite` plugin) instead of v3 + PostCSS config — simpler
  setup, same utility classes, tokens defined via `@theme` + CSS custom properties in
  `index.css` rather than `tailwind.config.js`.
- shadcn/ui was specified in the original frontend docs but not used — custom Tailwind
  components were built directly instead to avoid the extra dependency/setup weight for
  a project this size. Swap in shadcn later if the component surface area grows a lot.
- `analysis_id`'s full result payload travels via React Router state, not a global
  store — acceptable per the "no Redux" rule. Originally meant refresh lost the AI-text
  fields; now backfilled by `GET /analyze/{id}` on mount when state is missing (see
  Progress Log).

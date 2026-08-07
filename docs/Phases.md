# Phases — FounderPilot AI

Original build plan (hackathon-style, backend and frontend built in parallel against the
shared contract in `Architecture.md`). Kept here as a record and as the template for
future phases — add a new `## Phase N` section for the next round of work instead of
rewriting this file.

## Phase 0 — Setup ✅
- [x] Monorepo scaffold: `backend/`, `frontend/`, `docs/`
- [x] `requirements.txt` (backend), `package.json` (frontend)
- [x] Single root `.env.example`, `.gitignore`, `README.md`

## Phase 1 — Backend skeleton + health score ✅
- [x] FastAPI app boots, `GET /health` → `{"status": "ok"}`
- [x] Pydantic models for `StartupInput` / `AnalysisResult` per contract
- [x] `health_score.py`: weighted formula → health/risk/funding-readiness scores, runway
- [x] `POST /analyze` wired end-to-end

## Phase 2 — Persistence + remaining endpoints ✅
- [x] SQLite table for analyses, `POST /analyze` persists and returns a real `analysis_id`
- [x] `GET /metrics/{id}` returns the projected 3-point trend
- [x] `GET /recommendations/{id}` implemented (deterministic expansion of stored opportunities)
- [x] CORS enabled via `FRONTEND_ORIGIN`

## Phase 3 — AI integration ✅
- [x] `prompts.py` + `ai_client.py`: Grok call, JSON-only enforcement, retry-once,
      deterministic fallback with `ai_degraded` flag
- [x] `POST /chat` grounded in the stored analysis

## Phase 4 — Hardening ✅
- [x] Validation errors → `422` + error envelope
- [x] Unknown `analysis_id` → `404` + error envelope
- [x] No raw stack traces ever returned to the client

## Phase 5 — Frontend build ✅
- [x] Landing, Intake Form, Results (Dashboard/Insights/Chat tabs), 404
- [x] `api/client.ts` single fetch wrapper, `types/api.ts` mirroring the contract
- [x] Recharts wired to `/metrics`, "Projected" badge
- [x] Loading/error/degraded states on every screen that calls the API
- [x] Dark/light theme toggle, mobile-responsive
- [x] `npm run build` verified clean (TypeScript + Vite)

## Phase 6 — Deploy (next step — do this before a real demo/launch)
- [ ] Push to GitHub, connect the repo in Render as a Blueprint (`render.yaml` at root
      deploys both services automatically)
- [ ] Set `XAI_API_KEY` in the Render dashboard for `founderpilot-ai-backend` (marked
      `sync: false` in `render.yaml` — Render will prompt for it, never commit it)
- [ ] Confirm `FRONTEND_ORIGIN` (backend) and `VITE_API_BASE_URL` (frontend) point at
      each other's actual deployed Render URLs — `render.yaml`'s defaults assume the
      default Render service-name URLs; update both if you rename either service
- [ ] Render free tier sleeps after 15 min idle (~60s cold start) — ping `GET /health`
      periodically if a live, always-warm demo matters
- [ ] Smoke test on the deployed URLs, not localhost

## How to add the next phase
When you come back to extend this project, add `## Phase 7 — <name>` here with its own
checklist, update `Memory.md`'s "Current State" section, and hand both files (plus
whichever of `PRD.md` / `Architecture.md` / `Design.md` / `Rules.md` are relevant) to
your AI tool as context — it won't need to re-read the whole codebase from scratch.

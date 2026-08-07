# Rules — FounderPilot AI

Hard constraints for any AI coding tool (Claude Code, Cursor, Copilot, etc.) working on
this repo. Follow exactly — they exist to keep the two halves compatible and the app
demo/production-safe.

## Backend (`/backend`)

**Must use**
- FastAPI + Pydantic v2 for every request/response model — no raw dicts in/out of routes.
- `httpx.AsyncClient` for the Groq API call. Never `requests` (blocking) inside `async def`.
- Env vars via `.env` + `pydantic-settings`. Never hardcode `GROQ_API_KEY` or any secret.
- SQLite via SQLAlchemy for persistence. Schema lives only in `db_models.py`.
- Exact field names/types from `Architecture.md` Section 4. Change the contract there
  first, in the same commit as any code change.

**Must not use**
- No frontend/UI code in `/backend`.
- No ORMs other than SQLAlchemy, no other web frameworks mixed in.
- No synchronous/blocking calls inside `async def` routes.
- No returning raw, un-parsed LLM text to the client — always parsed into the fixed
  schema before leaving `ai_client.py`.

**AI call rules (Groq)**
- Endpoint `https://api.groq.com/openai/v1/chat/completions`, model ID from `GROQ_MODEL`
  env var — confirm the current slug at console.groq.com/docs/models; never hardcode it
  in source.
- Use a fast tier model for `/analyze` and `/chat` (default `llama-3.3-70b-versatile`),
  not a slower/heavier reasoning model — speed and cost control matter more than max
  reasoning depth here.
- `response_format: {"type": "json_object"}` plus an explicit "JSON only, no markdown
  fences" instruction in the prompt — belt and suspenders.
- Try once → on invalid JSON/failure, retry once with a stricter prompt → on second
  failure or timeout, fall back to a deterministic template built from the already
  computed health-score numbers, with `ai_degraded: true`. `/analyze` must never 500
  because the LLM had a bad moment.
- Explicit request timeout (`GROQ_TIMEOUT_SECONDS`, default 8s).
- Prompt templates live in `prompts.py`, never inline in route handlers.

**Error handling**
- Every route returns the shared error envelope (`Architecture.md` 4.5) via
  `raise_api_error()` — never a bare FastAPI default error page.
- Validation errors → `422`, `VALIDATION_ERROR`. Unknown `analysis_id` → `404`, `NOT_FOUND`.

**Style**
- Type hints on every function. One router file per resource. One-line docstring at the
  top of every service function (input → output).

## Frontend (`/frontend`)

**Must use**
- React + TypeScript, Tailwind CSS.
- Recharts specifically for charts (matches `/metrics`'s `labels` array shape).
- A single `api/client.ts` fetch wrapper for every backend call — no ad-hoc `fetch()`
  scattered through components.
- `VITE_API_BASE_URL` from `.env` for the API base — never hardcode `localhost:8000`.
- TypeScript interfaces in `types/api.ts` mirroring `Architecture.md` Section 4 exactly —
  field names/casing must match the backend's JSON, not be "prettied up."

**Must not use**
- No backend/scoring/AI logic in the frontend. If a number looks off, flag it to the
  backend — never recompute or "fix" it client-side.
- No Redux/MobX — React state + URL params is enough for this scope.
- No `localStorage`/`sessionStorage` for the analysis result — keep it in router
  state/React state so a reload cleanly re-fetches rather than showing stale data.

**Error & loading states (required on every screen that calls the API)**
- **Loading:** a real loading indicator, never a blank screen.
- **Error:** read `message` from the error envelope and show it in a banner/toast —
  never a raw stack trace or "undefined" on screen.
- **Degraded AI:** if `ai_degraded: true`, show the calm `DegradedNotice` component
  instead of treating it as a hard error — the numbers are real, only the AI text is a
  fallback.

**Style**
- Mobile-first responsive layout.
- Components named by what they render (`ScoreCard.tsx`, not `Card1.tsx`).
- Follow the color/type tokens in `Design.md` — no ad-hoc colors per component.

## Definition of done (either half)
1. Matches the contract in `Architecture.md` exactly (names, types, status codes).
2. Works with a valid payload AND a deliberately broken/missing-field payload — no crash.
3. Tested backend↔frontend together (not just Postman/mock data) before marking complete.

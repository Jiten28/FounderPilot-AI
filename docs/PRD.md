# PRD — FounderPilot AI
## "Your AI Co-founder for Startup Growth"

## 1. What this project is
A structured decision-support dashboard for early-stage founders. A founder fills one
form; the app returns a deterministic health score plus AI-generated risks, growth
opportunities, KPIs, and a 30-day action plan — not a generic chatbot.

Two halves, one contract:
- **Backend** (`/backend`) — FastAPI + SQLite + Groq. Owns every number and every
  piece of advice.
- **Frontend** (`/frontend`) — React + TypeScript + Tailwind + Recharts. A pure client;
  never computes or invents a number itself.

## 2. Target user
An early-stage startup founder who wants a fast, visual read on business health without
hiring a consultant or filling out a 40-field spreadsheet.

## 3. Core features / screens

| # | Feature | Endpoint | Screen |
|---|---------|----------|--------|
| 1 | Startup analysis (health score, risk, funding readiness, summary, action plan) | `POST /analyze` | Intake Form → Dashboard |
| 2 | Follow-up AI chat grounded in the analysis | `POST /chat` | Chat tab |
| 3 | Chart-ready projected metrics | `GET /metrics/{id}` | Dashboard tab |
| 4 | Expanded recommendations | `GET /recommendations/{id}` | Insights tab |
| 5 | Health check for deploy monitoring | `GET /health` | — |
| 6 | Landing page | — | Landing |

## 4. Core user flow
Landing → "Start Analysis" → Intake form → submit (`POST /analyze`) → loading state →
Results page with Dashboard / AI Insights / Chat as tabs sharing one `analysis_id`.

## 5. Non-goals (current version)
- No auth/login system.
- No trained ML model — health score is a transparent, weighted-rule formula (see
  `Rules.md`), by design: explainable over sophisticated.
- No multi-tenant billing.
- No editing/re-running a past analysis — one form, one result per session. (A page
  refresh on `/results/:id` re-fetches everything, including the original analysis text,
  via `GET /analyze/:id` — see `Architecture.md`.)
- No mobile-native app — responsive web only.

## 6. Success criteria
- `POST /analyze` returns a schema-correct response even if the LLM call is slow or
  fails (deterministic fallback, `ai_degraded: true`).
- Every field `/analyze` returns is displayed somewhere in the UI — nothing silently
  dropped, nothing computed client-side.
- Loading, empty, and error states exist for every API call.
- Zero crashes on missing/partial form fields — validated, not 500-errored.

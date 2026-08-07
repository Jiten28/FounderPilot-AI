# Architecture — FounderPilot AI

## 1. Repo layout (monorepo)

```
founderpilot-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── config.py          # env vars via pydantic-settings
│   │   ├── models/
│   │   │   ├── schemas.py     # Pydantic request/response models (Section 4)
│   │   │   └── db_models.py   # SQLite table models
│   │   ├── routers/
│   │   │   ├── analyze.py     # POST /analyze
│   │   │   ├── chat.py        # POST /chat
│   │   │   ├── metrics.py     # GET /metrics/{analysis_id}
│   │   │   └── recommendations.py
│   │   ├── services/
│   │   │   ├── health_score.py   # weighted-rule scoring (Section 5)
│   │   │   ├── ai_client.py      # Grok (xAI) wrapper + JSON parsing/repair
│   │   │   └── prompts.py        # all prompt templates
│   │   ├── db/
│   │   │   ├── database.py    # SQLite engine/session
│   │   │   └── crud.py
│   │   └── utils/errors.py    # shared error envelope (Section 4.5)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx            # routes: /, /form, /results/:analysisId
│   │   ├── api/client.ts      # single fetch wrapper, reads VITE_API_BASE_URL
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── IntakeForm.tsx
│   │   │   ├── Results.tsx    # hosts Dashboard / Insights / Chat as tabs
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── dashboard/     # ScoreCard, MetricsCharts
│   │   │   ├── insights/      # InsightList, ActionPlan, ExpandedRecommendations
│   │   │   ├── chat/          # ChatWindow, MessageBubble
│   │   │   ├── layout/        # NavBar
│   │   │   ├── RiskBadge.tsx
│   │   │   └── PageState.tsx  # Loading / Error / Degraded-notice
│   │   ├── hooks/useTheme.ts
│   │   ├── types/api.ts       # TypeScript interfaces mirroring Section 4 exactly
│   │   └── lib/cn.ts
│   ├── index.html
│   └── package.json
├── docs/                       # this folder — paste as project context for any AI tool
├── render.yaml                 # Render Blueprint, deploys both services
├── .env.example                 # one file, sectioned backend/frontend
├── .gitignore                   # one file, covers Python + Node
└── README.md
```

## 2. Tech stack

**Backend:** FastAPI (async), Uvicorn, Pydantic v2, SQLAlchemy + SQLite, `httpx` async
client for the AI call, Groq API (`https://api.groq.com/openai/v1/chat/completions`,
OpenAI-compatible schema, auth via `Authorization: Bearer <GROQ_API_KEY>`). Model ID comes
from `GROQ_MODEL` env var — never hardcoded, since Groq occasionally retires/renames
slugs. Default is `llama-3.3-70b-versatile`, a fast free-tier model.

**Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4, `react-router-dom`, Recharts.
No Redux — React state + URL params (`analysis_id` lives in the route).

**Deployment:** Render for both — backend as a Docker web service, frontend as a static
site. See `render.yaml`.

## 3. Request flow

```
IntakeForm.tsx (frontend)
   │ user submits
   ▼
POST /analyze ──────────► FastAPI router
   │                         │
   │                         ▼
   │                 Pydantic validates StartupInput
   │                         │
   │                         ▼
   │                 health_score.py computes deterministic
   │                 numeric scores (no AI, always succeeds)
   │                         │
   │                         ▼
   │                 ai_client.py sends prompt to Groq,
   │                 forces JSON-only response, validates,
   │                 retries once, falls back deterministically
   │                         │
   │                         ▼
   │                 Result saved to SQLite, analysis_id returned
   ▼                         │
On success: navigate to      │
/results/:analysisId,        │
analysis stored in router    │
state (see note below)       │
   │                         │
   ▼                         ▼
Results.tsx           (analysis_id reused by /chat, /metrics,
 ├─ Dashboard tab      /recommendations — all fetched fresh by id)
 ├─ Insights tab
 └─ Chat tab → POST /chat with { analysis_id, message } per turn
```

The full `AnalysisResult` (summary/risks/opportunities/action plan) is passed via router
state from the intake form's `POST /analyze` response for the immediate post-submit
render (no extra round trip). On a hard refresh of `/results/:id` — where router state is
gone — the frontend now falls back to `GET /analyze/{id}` (Section 4.1b) to re-fetch it,
alongside the existing `/metrics` and `/recommendations` calls. Only an unknown/expired
`analysis_id` (backend restarted with a fresh SQLite file, id typo'd, etc.) shows the
"start a new analysis" prompt now.

## 4. API Contract (canonical — do not let frontend/backend drift)

Base URL, local: `http://localhost:8000`. Frontend reads it from `VITE_API_BASE_URL`.

All responses are JSON. All error responses use the envelope in 4.5.

### 4.1 `POST /analyze`

Request body:
```json
{
  "startup_name": "string",
  "industry": "string",
  "revenue": 12000,
  "expenses": 9000,
  "employees": 4,
  "monthly_users": 3200,
  "stage": "Pre-seed | Seed | Series A | Growth",
  "funding_raised": 50000,
  "problem_faced": "string, free text"
}
```

Response body:
```json
{
  "analysis_id": "uuid-string",
  "health_score": 78,
  "risk_score": 34,
  "risk_level": "Low | Medium | High",
  "funding_readiness_score": 65,
  "runway_months": 14,
  "business_summary": "2-3 sentence plain-language summary",
  "top_risks": ["string", "string", "string"],
  "growth_opportunities": ["string", "string", "string"],
  "recommended_kpis": ["string", "string", "string"],
  "action_plan_30_days": [
    { "priority": "Immediate | High | Medium | Low", "task": "string" }
  ],
  "created_at": "ISO-8601 timestamp",
  "ai_degraded": false
}
```

### 4.1b `GET /analyze/{analysis_id}`

Re-fetches a previously created analysis by id — same response shape as 4.1's `POST
/analyze` response. Used by the frontend on a hard refresh of `/results/:id`, when
router state (holding the original `POST /analyze` response) is gone. Unknown id → `404`
`NOT_FOUND` via the error envelope (4.5).

### 4.2 `POST /chat`
Request: `{ "analysis_id": "uuid-string", "message": "Should I hire another developer?" }`
Response: `{ "reply": "string", "analysis_id": "uuid-string" }`

### 4.3 `GET /metrics/{analysis_id}`
```json
{
  "labels": ["Month 1", "Month 2", "Month 3"],
  "revenue": [12000, 13500, 15200],
  "expenses": [9000, 9400, 9600],
  "burn": [3000, 4100, 5600],
  "users": [3200, 3900, 4700],
  "projected": true
}
```
Always `projected: true` in the current version (no historical data is collected) — the
UI shows a "Projected" badge on every chart, never presented as historical fact.

### 4.4 `GET /recommendations/{analysis_id}`
```json
{
  "analysis_id": "uuid-string",
  "expanded_recommendations": [
    { "title": "string", "detail": "string", "impact": "High | Medium | Low" }
  ]
}
```

### 4.5 Error envelope (all endpoints, all non-2xx responses)
```json
{ "error": true, "code": "VALIDATION_ERROR | NOT_FOUND | AI_TIMEOUT | SERVER_ERROR", "message": "human-readable string" }
```
Frontend rule: every call site checks `error === true` first and renders `message` in a
toast/banner — never reads success-shape fields on an error response.

## 5. Health score logic
Deterministic, weighted-rule formula in `health_score.py` — never computed by the LLM.
Five weighted components (30/25/20/15/10 = 100 max): runway, revenue/expense ratio,
user traction vs. stage benchmark, funding-stage bonus, team-size sanity. See the
docstrings in `health_score.py` for exact thresholds.

## 6. CORS
`main.py` allows exactly one origin, from `FRONTEND_ORIGIN` env var — not wide open.

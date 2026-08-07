# FounderPilot AI

Your AI co-founder for startup growth — a founder fills one form, the app returns a
health score, risk read, and a 30-day action plan. FastAPI backend + React frontend,
one xAI Grok API key needed.

```
founderpilot-ai/
├── backend/     FastAPI + SQLite + xAI Grok
├── frontend/    React + TypeScript + Tailwind + Recharts
├── docs/        PRD, Architecture, Rules, Phases, Design, Memory — paste into any
│                AI coding tool as project context before asking it to extend this app
├── render.yaml  one-click Render Blueprint (deploys both services)
└── .env.example one file, sectioned for backend/ and frontend/
```

## Run locally

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env         # keep only the backend section's values
uvicorn app.main:app --reload
```
Runs at `http://localhost:8000` (docs at `/docs`).

**Frontend** (new terminal)
```bash
cd frontend
npm install
cp ../.env.example .env         # keep only the frontend section's values
npm run dev
```
Runs at `http://localhost:5173`.

Without `XAI_API_KEY` set, `/analyze` and `/chat` automatically use a deterministic
fallback (`ai_degraded: true`) instead of failing — the app is fully usable before you
add a key.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. `render.yaml` at the root
   deploys both `founderpilot-ai-backend` (Docker web service) and
   `founderpilot-ai-frontend` (static site) in one go.
3. Set `XAI_API_KEY` in the Render dashboard for the backend service (it's marked
   `sync: false` in `render.yaml` so Render prompts for it rather than needing it in git).
4. Render's default URLs are `https://founderpilot-ai-backend.onrender.com` and
   `https://founderpilot-ai-frontend.onrender.com`, already wired into `render.yaml`'s
   `FRONTEND_ORIGIN` / `VITE_API_BASE_URL`. If you rename either service, update both.
5. Free tier sleeps after 15 minutes idle (~60s cold start on the next request) — expect
   that on first load after a break.

## Extending this project
`docs/` holds the six standing docs (PRD, Architecture, Rules, Phases, Design, Memory).
Share that whole folder with an AI coding tool before asking for new features — `Memory.md`
tells it exactly what's already built so it doesn't re-scan the codebase or re-ask
questions already answered. Update `Memory.md` yourself (or ask the AI tool to) after any
real work session.

# FounderPilot AI

Your AI co-founder for startup growth — a founder fills one form, the app returns a
health score, risk read, and a 30-day action plan. FastAPI backend + React frontend,
one Groq API key needed (free tier).

```
founderpilot-ai/
├── backend/     FastAPI + SQLite + Groq
├── frontend/    React + TypeScript + Tailwind + Recharts
├── docs/        PRD, Architecture, Rules, Phases, Design, Memory
├── render.yaml  one-click Render Blueprint (deploys both services)
└── .env.example one file, sectioned for backend/ and frontend/
```

## Run Locally

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows Command Prompt
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a file named `backend/.env` with the following content:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TIMEOUT_SECONDS=8.0
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=sqlite:///./founderpilot.db
```

> **Note:** Only include the variables listed above. Do **not** copy the root `.env.example` into `backend/.env`, as it contains frontend variables that will cause Pydantic's settings loader to throw an `extra_forbidden` error.

Start the backend server:

```bash
uvicorn app.main:app --reload
```

Backend will be available at:

- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

### Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install
```

Create a file named `frontend/.env` with the following content:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the frontend development server:

```bash
npm run dev
```

Frontend will be available at:

- Application: `http://localhost:5173`

---

### Project Structure

```text
project/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── app/
├── frontend/
│   ├── .env
│   ├── package.json
│   └── src/
└── README.md
```

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- A Groq API key (free — https://console.groq.com/keys)

Runs at `http://localhost:5173`.

> The root `.env.example` is a reference showing every variable the project uses,
> sectioned by app — it is not meant to be copied wholesale into either `.env` file.
> Each app's `.env` should contain only its own section's lines.

Without `GROQ_API_KEY` set, `/analyze` and `/chat` automatically use a deterministic
fallback (`ai_degraded: true`) instead of failing — the app is fully usable before you
add a key.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. `render.yaml` at the root
   deploys both `founderpilot-ai-backend` (Docker web service) and
   `founderpilot-ai-frontend` (static site) in one go.
3. Set `GROQ_API_KEY` in the Render dashboard for the backend service (it's marked
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

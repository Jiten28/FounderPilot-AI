# FounderPilot AI — Backend

## Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# then fill in XAI_API_KEY in .env
uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

## Env vars (`.env`)
- `XAI_API_KEY` — from the xAI console. Without it, `/analyze` and `/chat` automatically
  use the deterministic fallback (`ai_degraded: true`) instead of failing — safe for local
  dev before the key is set.
- `FRONTEND_ORIGIN` — must match Person B's dev/deploy URL exactly, or CORS blocks requests.
- `GROK_MODEL` — confirm the current model ID in the xAI console before the hackathon; the
  default here may be stale by the time you read this.

## Notes
- `venv/` and `*.db` are gitignored — never commit either. If you already committed `venv/`
  in a previous push, remove it from the repo (`git rm -r --cached backend/venv`) before your
  next commit, or the repo size will balloon and slow down every clone/pull for your teammate.
- SQLite file (`founderpilot.db`) is created automatically on first run — don't commit it,
  it's local dev data only.

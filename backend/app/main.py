from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.db.database import init_db
from app.routers import analyze, chat, metrics, recommendations, whatif, competitors

app = FastAPI(title="FounderPilot AI Backend", version="0.1.0")

# CORS locked to the frontend origin, per Architecture.md Section 6 —
# not wide-open, since Person B's docs specify exactly which origins to allow.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Per Rules.md: validation errors return 422 + the shared error envelope,
# not FastAPI's default error shape.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "code": "VALIDATION_ERROR",
            "message": "; ".join(f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()),
        },
    )


# raise_api_error() (utils/errors.py) puts the envelope in HTTPException.detail as
# a dict. Without this handler, FastAPI's default wraps it a second time as
# {"detail": {...}} — this unwraps it so the response body matches
# Architecture.md 4.5 exactly: {"error": true, "code": ..., "message": ...}
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    # fallback for any HTTPException not raised via raise_api_error()
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "code": "SERVER_ERROR", "message": str(exc.detail)},
    )


app.include_router(analyze.router)
app.include_router(chat.router)
app.include_router(metrics.router)
app.include_router(recommendations.router)
app.include_router(whatif.router)
app.include_router(competitors.router)
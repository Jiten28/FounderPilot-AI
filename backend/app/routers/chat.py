"""POST /chat — grounded by the stored analysis, per Architecture.md 4.2."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_client import get_chat_reply
from app.db.database import get_db
from app.db.crud import get_analysis
from app.utils.errors import raise_api_error

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    record = get_analysis(db, req.analysis_id)
    if record is None:
        raise_api_error("NOT_FOUND", f"No analysis found for id {req.analysis_id}")

    context = {
        "startup_name": record.startup_name,
        "industry": record.industry,
        "stage": record.stage,
        "problem_faced": record.problem_faced,
        "health_score": record.health_score,
        "risk_score": record.risk_score,
        "risk_level": record.risk_level,
        "runway_months": record.runway_months,
    }

    reply = await get_chat_reply(context, req.message)
    return ChatResponse(reply=reply, analysis_id=req.analysis_id)
"""POST /chat — grounded by the stored analysis, per Architecture.md 4.2.
Now with persisted history (Architecture.md 4.6b): each turn is stored, and
prior turns are fed back to the model so the conversation actually accumulates
context instead of treating every message as a cold, isolated question."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import ChatRequest, ChatResponse, ChatHistoryResponse, ChatHistoryMessage
from app.services.ai_client import get_chat_reply
from app.db.database import get_db
from app.db.crud import get_analysis, add_chat_message, get_chat_history
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

    # Load prior turns BEFORE adding this one, so the model sees history
    # leading up to (not including) the current question.
    history = get_chat_history(db, req.analysis_id)
    history_pairs = [{"role": m.role, "text": m.text} for m in history]

    reply = await get_chat_reply(context, req.message, history_pairs)

    add_chat_message(db, req.analysis_id, "founder", req.message)
    add_chat_message(db, req.analysis_id, "ai", reply)

    return ChatResponse(reply=reply, analysis_id=req.analysis_id)


@router.get("/chat/{analysis_id}/history", response_model=ChatHistoryResponse)
def chat_history(analysis_id: str, db: Session = Depends(get_db)):
    """Lets the frontend restore the conversation on a hard refresh instead of
    losing it — chat memory that only lives in React state disappears the
    moment the tab reloads."""
    record = get_analysis(db, analysis_id)
    if record is None:
        raise_api_error("NOT_FOUND", f"No analysis found for id {analysis_id}")

    history = get_chat_history(db, analysis_id, limit=100)
    return ChatHistoryResponse(
        analysis_id=analysis_id,
        messages=[ChatHistoryMessage(role=m.role, text=m.text, created_at=m.created_at) for m in history],
    )
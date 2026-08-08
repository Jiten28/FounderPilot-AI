"""
All direct DB reads/writes live here — routers call these functions, never
the SQLAlchemy session directly. Keeps persistence logic in one place.
"""

import uuid
from sqlalchemy.orm import Session
from app.models.db_models import AnalysisRecord, ChatMessage
from app.models.schemas import StartupInput


def create_analysis(
    db: Session,
    data: StartupInput,
    health_score: int,
    risk_score: int,
    risk_level: str,
    funding_readiness_score: int,
    runway_months: float,
    business_summary: str,
    top_risks: list[str],
    growth_opportunities: list[str],
    recommended_kpis: list[str],
    action_plan_30_days: list[dict],
    benchmarks: list[dict],
    ai_degraded: bool = False,
) -> AnalysisRecord:
    record = AnalysisRecord(
        analysis_id=str(uuid.uuid4()),
        startup_name=data.startup_name,
        industry=data.industry,
        revenue=data.revenue,
        expenses=data.expenses,
        employees=data.employees,
        monthly_users=data.monthly_users,
        stage=data.stage,
        funding_raised=data.funding_raised,
        problem_faced=data.problem_faced,
        health_score=health_score,
        risk_score=risk_score,
        risk_level=risk_level,
        funding_readiness_score=funding_readiness_score,
        runway_months=runway_months,
        business_summary=business_summary,
        top_risks=top_risks,
        growth_opportunities=growth_opportunities,
        recommended_kpis=recommended_kpis,
        action_plan_30_days=action_plan_30_days,
        benchmarks=benchmarks,
        ai_degraded=ai_degraded,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_analysis(db: Session, analysis_id: str) -> AnalysisRecord | None:
    return db.query(AnalysisRecord).filter(AnalysisRecord.analysis_id == analysis_id).first()


# ---------- Chat memory ----------

def add_chat_message(db: Session, analysis_id: str, role: str, text: str) -> ChatMessage:
    msg = ChatMessage(analysis_id=analysis_id, role=role, text=text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(db: Session, analysis_id: str, limit: int = 20) -> list[ChatMessage]:
    """Most recent `limit` messages, oldest first — ready to drop straight into
    a prompt or a chat UI. 20 messages is plenty of context for a founder Q&A
    without letting the prompt grow unbounded over a long session."""
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.analysis_id == analysis_id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()[::-1]
    )
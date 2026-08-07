"""POST /analyze — the main endpoint. See PRD.md Feature #1, P0."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import StartupInput, AnalysisResult
from app.services.health_score import compute_deterministic_metrics
from app.services.ai_client import get_ai_analysis
from app.db.database import get_db
from app.db.crud import create_analysis

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_startup(data: StartupInput, db: Session = Depends(get_db)):
    # Step 1: deterministic metrics, always succeeds, no AI involved
    metrics = compute_deterministic_metrics(data)

    # Step 2: AI analysis — never raises; degrades to a deterministic fallback
    # on failure/timeout, with ai_degraded flagged for the frontend to show a notice
    ai_result, ai_degraded = await get_ai_analysis(data, metrics)

    # Step 3: persist so /chat, /metrics, /recommendations can reload this analysis
    record = create_analysis(
        db=db,
        data=data,
        health_score=metrics["health_score"],
        risk_score=metrics["risk_score"],
        risk_level=metrics["risk_level"],
        funding_readiness_score=metrics["funding_readiness_score"],
        runway_months=metrics["runway_months"],
        business_summary=ai_result["business_summary"],
        top_risks=ai_result["top_risks"],
        growth_opportunities=ai_result["growth_opportunities"],
        recommended_kpis=ai_result["recommended_kpis"],
        action_plan_30_days=ai_result["action_plan_30_days"],
        ai_degraded=ai_degraded,
    )

    return AnalysisResult(
        analysis_id=record.analysis_id,
        health_score=record.health_score,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        funding_readiness_score=record.funding_readiness_score,
        runway_months=record.runway_months,
        business_summary=record.business_summary,
        top_risks=record.top_risks,
        growth_opportunities=record.growth_opportunities,
        recommended_kpis=record.recommended_kpis,
        action_plan_30_days=record.action_plan_30_days,
        created_at=record.created_at,
        ai_degraded=record.ai_degraded,
    )
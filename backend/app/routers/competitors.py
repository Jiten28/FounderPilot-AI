"""
GET /competitors/{analysis_id} — Competitor Snapshot.

Recomputes from the stored analysis record (same pattern as /recommendations
and /metrics — no extra table needed, the input fields are already persisted
on AnalysisRecord). Peer selection is deterministic and always succeeds
(services/competitors.py); the positioning narrative on top is AI-generated
but degrades gracefully to a deterministic summary, same contract as /analyze.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import (
    StartupInput,
    CompetitorAnalysisResponse,
    CompetitorPeer,
    MarketStats,
)
from app.services.competitors import get_competitor_snapshot
from app.services.health_score import compute_deterministic_metrics
from app.services.ai_client import get_competitor_analysis
from app.db.database import get_db
from app.db.crud import get_analysis
from app.utils.errors import raise_api_error

router = APIRouter()


@router.get("/competitors/{analysis_id}", response_model=CompetitorAnalysisResponse)
async def get_competitors(analysis_id: str, db: Session = Depends(get_db)):
    record = get_analysis(db, analysis_id)
    if record is None:
        raise_api_error("NOT_FOUND", f"No analysis found for id {analysis_id}")

    data = StartupInput(
        startup_name=record.startup_name,
        industry=record.industry,
        revenue=record.revenue,
        expenses=record.expenses,
        employees=record.employees,
        monthly_users=record.monthly_users,
        stage=record.stage,
        funding_raised=record.funding_raised,
        problem_faced=record.problem_faced,
    )

    # Deterministic peer selection first — always succeeds, no AI, no network.
    snapshot = get_competitor_snapshot(data)

    # Deterministic metrics, already computed once at /analyze time but cheap
    # enough (and side-effect-free) to recompute here rather than re-fetch.
    metrics = compute_deterministic_metrics(data)

    # AI narrative on top of the real peer list — never invents a competitor,
    # degrades to a deterministic summary if Groq fails/times out/is unmatched.
    result, ai_degraded = await get_competitor_analysis(data, metrics, snapshot)

    return CompetitorAnalysisResponse(
        analysis_id=analysis_id,
        matched=snapshot["matched"],
        industry_bucket=snapshot["industry_bucket"],
        percentile_rank=snapshot["percentile_rank"],
        market_stats=MarketStats(**snapshot["market_stats"]) if snapshot["market_stats"] else None,
        peers=[CompetitorPeer(**p) for p in snapshot["peers"]],
        positioning_summary=result["positioning_summary"],
        differentiation_tips=result["differentiation_tips"],
        ai_degraded=ai_degraded,
    )
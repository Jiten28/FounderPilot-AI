"""
GET /recommendations/{analysis_id} — deeper recommendations, per Architecture.md 4.4.
Priority P1 per PRD.md: stubbed with deterministic content is acceptable if
Hour 3-4 time runs short; wired for a real AI call here since the pattern is
identical to /analyze's AI call.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import RecommendationsResponse, ExpandedRecommendation
from app.db.database import get_db
from app.db.crud import get_analysis
from app.utils.errors import raise_api_error

router = APIRouter()


@router.get("/recommendations/{analysis_id}", response_model=RecommendationsResponse)
def get_recommendations(analysis_id: str, db: Session = Depends(get_db)):
    record = get_analysis(db, analysis_id)
    if record is None:
        raise_api_error("NOT_FOUND", f"No analysis found for id {analysis_id}")

    # Deterministic expansion of the already-stored growth_opportunities —
    # keeps this endpoint fast and reliable without a second LLM round-trip.
    # Swap for a real AI call later if time allows (same pattern as ai_client.py).
    recommendations = [
        ExpandedRecommendation(
            title=opportunity,
            detail=f"Tied to current risk level ({record.risk_level}) and a health score of {record.health_score}/100.",
            impact="High" if record.risk_level == "High" else "Medium",
        )
        for opportunity in record.growth_opportunities
    ]

    return RecommendationsResponse(analysis_id=analysis_id, expanded_recommendations=recommendations)
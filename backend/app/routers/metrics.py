"""
GET /metrics/{analysis_id} — chart-ready projected trend, per Architecture.md 4.3.

MVP note (per the docs): no historical data is collected from the founder, so
this projects a 3-point trend from the single form submission using simple
growth/burn assumptions. Always returns projected=True — never presented as
real historical data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import MetricsResponse
from app.db.database import get_db
from app.db.crud import get_analysis
from app.utils.errors import raise_api_error

router = APIRouter()


@router.get("/metrics/{analysis_id}", response_model=MetricsResponse)
def get_metrics(analysis_id: str, db: Session = Depends(get_db)):
    record = get_analysis(db, analysis_id)
    if record is None:
        raise_api_error("NOT_FOUND", f"No analysis found for id {analysis_id}")

    # Simple linear projection: assume modest month-over-month growth/decline
    # consistent with the health score. This is intentionally simple per
    # health_score.py's philosophy — explainable over sophisticated.
    growth_factor = 1.05 if record.health_score >= 60 else 1.02 if record.health_score >= 40 else 0.98

    revenue = [round(record.revenue * (growth_factor ** i), 2) for i in range(3)]
    expenses = [round(record.expenses * (1.02 ** i), 2) for i in range(3)]
    burn = [round(max(e - r, 0), 2) for r, e in zip(revenue, expenses)]
    users = [round(record.monthly_users * (growth_factor ** i)) for i in range(3)]

    return MetricsResponse(
        labels=["Month 1", "Month 2", "Month 3"],
        revenue=revenue,
        expenses=expenses,
        burn=burn,
        users=users,
        projected=True,
    )
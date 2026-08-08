"""
POST /whatif — the "what-if sliders" feature. Re-runs the exact same
deterministic scoring formula from health_score.py against edited inputs.
Stateless, no AI call, no persistence — safe to call on every slider drag
without worrying about cost or latency.
"""

from fastapi import APIRouter
from app.models.schemas import StartupInput, WhatIfResponse
from app.services.health_score import compute_deterministic_metrics

router = APIRouter()


@router.post("/whatif", response_model=WhatIfResponse)
def what_if(data: StartupInput):
    metrics = compute_deterministic_metrics(data)
    return WhatIfResponse(
        health_score=metrics["health_score"],
        risk_score=metrics["risk_score"],
        risk_level=metrics["risk_level"],
        funding_readiness_score=metrics["funding_readiness_score"],
        runway_months=metrics["runway_months"],
        burn_rate=metrics["burn_rate"],
    )

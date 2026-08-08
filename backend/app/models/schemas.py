"""
Request/response models — field names and types copied verbatim from
Architecture.md Section 4 (the canonical contract, byte-identical in
Person B's docs). Do not rename anything here without editing both
Architecture.md files in the same commit.
"""

from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


# ---------- 4.1 POST /analyze ----------

class StartupInput(BaseModel):
    startup_name: str
    industry: str
    revenue: float = Field(ge=0)
    expenses: float = Field(ge=0)
    employees: int = Field(ge=1)
    monthly_users: int = Field(ge=0)
    stage: Literal["Pre-seed", "Seed", "Series A", "Growth"]
    funding_raised: float = Field(ge=0)
    problem_faced: str


class ActionPlanItem(BaseModel):
    priority: Literal["Immediate", "High", "Medium", "Low"]
    task: str


class BenchmarkComparison(BaseModel):
    """One row of the benchmarking feature — the founder's own number next to a
    stage-typical reference point. See services/benchmarks.py for the source data."""
    metric: str
    your_value: str
    benchmark_value: str
    comparison: str


class AnalysisResult(BaseModel):
    analysis_id: str
    original_input: StartupInput  # needed by the frontend to seed the what-if
                                    # sliders at the founder's real starting values,
                                    # even after a hard refresh loses router state
    health_score: int
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    funding_readiness_score: int
    runway_months: float
    business_summary: str
    top_risks: list[str]
    growth_opportunities: list[str]
    recommended_kpis: list[str]
    action_plan_30_days: list[ActionPlanItem]
    benchmarks: list[BenchmarkComparison] = []
    created_at: datetime
    ai_degraded: bool = False  # only present/true when the AI call failed and a
                                # deterministic fallback was used — see Rules.md


# ---------- 4.2 POST /chat ----------

class ChatRequest(BaseModel):
    analysis_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    analysis_id: str


class ChatHistoryMessage(BaseModel):
    role: Literal["founder", "ai"]
    text: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    analysis_id: str
    messages: list[ChatHistoryMessage]


# ---------- 4.6 POST /whatif ----------
# Re-runs the deterministic scoring formula (health_score.py) against edited
# inputs. No AI call, no persistence — pure, fast computation so the frontend
# can offer "what if" sliders that update live.

class WhatIfResponse(BaseModel):
    health_score: int
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    funding_readiness_score: int
    runway_months: float
    burn_rate: float


# ---------- 4.3 GET /metrics/{analysis_id} ----------

class MetricsResponse(BaseModel):
    labels: list[str]
    revenue: list[float]
    expenses: list[float]
    burn: list[float]
    users: list[int]
    projected: bool = True  # MVP always projects from the single form submission


# ---------- 4.4 GET /recommendations/{analysis_id} ----------

class ExpandedRecommendation(BaseModel):
    title: str
    detail: str
    impact: Literal["High", "Medium", "Low"]


class RecommendationsResponse(BaseModel):
    analysis_id: str
    expanded_recommendations: list[ExpandedRecommendation]


# ---------- 4.5 Error envelope ----------

class ErrorResponse(BaseModel):
    error: bool = True
    code: Literal["VALIDATION_ERROR", "NOT_FOUND", "AI_TIMEOUT", "SERVER_ERROR"]
    message: str
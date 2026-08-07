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


class AnalysisResult(BaseModel):
    analysis_id: str
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
"""
SQLite table definitions. Only this file should define schema — keep persistence
concerns out of routers/services per Rules.md.
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class AnalysisRecord(Base):
    __tablename__ = "analyses"

    analysis_id = Column(String, primary_key=True, index=True)

    # --- input fields, stored so /chat and /recommendations can reload context ---
    startup_name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    revenue = Column(Float, nullable=False)
    expenses = Column(Float, nullable=False)
    employees = Column(Integer, nullable=False)
    monthly_users = Column(Integer, nullable=False)
    stage = Column(String, nullable=False)
    funding_raised = Column(Float, nullable=False)
    problem_faced = Column(String, nullable=False)

    # --- computed/deterministic fields ---
    health_score = Column(Integer, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    funding_readiness_score = Column(Integer, nullable=False)
    runway_months = Column(Float, nullable=False)

    # --- AI-generated fields (JSON-serialized lists/objects) ---
    business_summary = Column(String, nullable=False)
    top_risks = Column(JSON, nullable=False)
    growth_opportunities = Column(JSON, nullable=False)
    recommended_kpis = Column(JSON, nullable=False)
    action_plan_30_days = Column(JSON, nullable=False)
    benchmarks = Column(JSON, nullable=False, default=list)
    ai_degraded = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    """Persisted chat turns per analysis — what makes chat memory possible.
    Without this, every /chat call was a single grounded turn with no history;
    the AI had no idea what was said two messages ago."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String, ForeignKey("analyses.analysis_id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "founder" | "ai"
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
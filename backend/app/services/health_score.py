"""
Deterministic scoring — no AI call, ever. Per Rules.md: "a hackathon judge
should be able to open one file and understand how the number is produced."

ASSUMPTION FLAGGED: StartupInput has no cash_on_hand field (Architecture.md
4.1 doesn't include one), so runway is computed as funding_raised / burn_rate.
This is a reasonable proxy for pre-seed/seed startups but is an assumption on
my part, not something in the docs — confirm with your teammate that this is
the intended interpretation before Hour 1 checkpoint.
"""

from app.models.schemas import StartupInput


def calculate_burn_rate(revenue: float, expenses: float) -> float:
    return max(expenses - revenue, 0)


def calculate_runway_months(funding_raised: float, burn_rate: float) -> float:
    """Sentinel 999.0 for profitable/break-even startups (no meaningful runway ceiling)."""
    if burn_rate <= 0:
        return 999.0
    return round(funding_raised / burn_rate, 1)


def calculate_health_score(data: StartupInput, burn_rate: float, runway_months: float) -> int:
    """
    0-100, five weighted components (30/25/20/15/10 = 100 max):
    - Runway (30): near-term survival signal
    - Revenue/expense ratio (25): sustainability
    - User count relative to stage (20): traction
    - Funding stage bonus (15): later stage = more credibility
    - Team size sanity (10): not over-weighted, small teams are normal early on
    """
    score = 0.0

    # Runway (0-30)
    if runway_months >= 18:
        score += 30
    elif runway_months >= 12:
        score += 24
    elif runway_months >= 6:
        score += 16
    elif runway_months >= 3:
        score += 8
    else:
        score += 2

    # Revenue/expense ratio (0-25)
    ratio = (data.revenue / data.expenses) if data.expenses > 0 else (1.0 if data.revenue > 0 else 0.0)
    if ratio >= 1.2:
        score += 25
    elif ratio >= 1.0:
        score += 20
    elif ratio >= 0.7:
        score += 14
    elif ratio >= 0.4:
        score += 8
    else:
        score += 3

    # Monthly users relative to stage (0-20)
    stage_benchmarks = {"Pre-seed": 20, "Seed": 100, "Series A": 1000, "Growth": 10000}
    benchmark = stage_benchmarks.get(data.stage, 100)
    user_ratio = min(data.monthly_users / benchmark, 1.5) if benchmark else 1.0
    score += min(round(user_ratio * 20), 20)

    # Stage bonus (0-15)
    stage_bonus = {"Pre-seed": 6, "Seed": 10, "Series A": 13, "Growth": 15}
    score += stage_bonus.get(data.stage, 8)

    # Team size sanity (0-10)
    if 1 <= data.employees <= 15:
        score += 10
    elif data.employees > 15:
        score += 7
    else:
        score += 5

    return min(round(score), 100)


def calculate_risk_score(data: StartupInput, burn_rate: float, runway_months: float) -> int:
    """
    0-100, higher = riskier. Inverse-ish of health score but weighted toward
    near-term cash risk specifically, since that's what "risk" means to a
    founder in practice.
    """
    risk = 0

    if runway_months < 3:
        risk += 40
    elif runway_months < 6:
        risk += 25
    elif runway_months < 12:
        risk += 10

    if burn_rate > data.revenue * 2 and data.revenue > 0:
        risk += 25
    elif burn_rate > data.revenue:
        risk += 15

    if data.stage in ("Series A", "Growth") and data.monthly_users < 500:
        risk += 20

    if data.employees == 1 and data.stage in ("Series A", "Growth"):
        risk += 15

    return min(risk, 100)


def risk_level_from_score(risk_score: int) -> str:
    if risk_score >= 60:
        return "High"
    elif risk_score >= 30:
        return "Medium"
    return "Low"


def calculate_funding_readiness(data: StartupInput, health_score: int, runway_months: float) -> int:
    """
    Separate from health_score deliberately — this is specifically an
    investor-lens number (do we look raise-ready), not a general wellness score.
    """
    score = round(health_score * 0.6)  # baseline off overall health

    if runway_months < 6:
        score -= 15  # low runway makes any raise feel urgent/desperate, not strategic
    if data.monthly_users > {"Pre-seed": 20, "Seed": 100, "Series A": 1000, "Growth": 10000}.get(data.stage, 100):
        score += 15  # ahead of stage benchmark = strong signal to investors
    if data.funding_raised == 0 and data.stage != "Pre-seed":
        score -= 10  # unusual not to have raised anything by this stage

    return max(min(score, 100), 0)


def compute_deterministic_metrics(data: StartupInput) -> dict:
    """
    Single entry point — everything /analyze needs that doesn't require the LLM.
    Returns a plain dict (not a Pydantic model) since routers/analyze.py combines
    this with AI fields before constructing the final AnalysisResult.
    """
    burn_rate = calculate_burn_rate(data.revenue, data.expenses)
    runway_months = calculate_runway_months(data.funding_raised, burn_rate)
    health_score = calculate_health_score(data, burn_rate, runway_months)
    risk_score = calculate_risk_score(data, burn_rate, runway_months)
    risk_level = risk_level_from_score(risk_score)
    funding_readiness_score = calculate_funding_readiness(data, health_score, runway_months)

    return {
        "burn_rate": burn_rate,
        "runway_months": runway_months,
        "health_score": health_score,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "funding_readiness_score": funding_readiness_score,
    }
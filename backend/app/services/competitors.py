"""
Competitor Snapshot — deterministic peer-selection layer, no AI involved.

Same philosophy as health_score.py and benchmarks.py: every number here is
plain arithmetic over the real peer dataset (industry_peer_startups.json,
911 real Indian startups, 2015-2017, MIT-licensed). This module ONLY selects
and ranks real rows from that dataset — it never invents a company. The AI
layer (ai_client.py::get_competitor_analysis) is handed this output as
ground truth and told explicitly not to name any company that isn't in it,
mirroring the "numbers first, AI second" contract the rest of the app uses.

Directly answers the "competitor analysis" capability named in PS10 (AI
Startup Copilot) that the base build didn't cover yet.
"""

from app.models.schemas import StartupInput
from app.services.benchmarks import (
    INDUSTRY_FUNDING_BENCHMARK,
    PEER_STARTUPS,
    _match_industry_bucket,
)

PEER_COUNT = 5


def _percentile_rank(amount: float, peer_amounts: list[float]) -> int:
    """% of same-bucket peers this startup has raised more than or equal to."""
    if not peer_amounts:
        return 0
    at_or_below = sum(1 for a in peer_amounts if amount >= a)
    return round((at_or_below / len(peer_amounts)) * 100)


def get_competitor_snapshot(data: StartupInput) -> dict:
    """
    Returns a plain dict:
      {
        "matched": bool,
        "industry_bucket": str | None,
        "percentile_rank": int,           # vs. same-bucket peers, by funding raised
        "market_stats": {"n", "median", "p25", "p75"} | None,
        "peers": [{"name", "amount_usd", "year", "delta_usd"}],  # nearest by funding
      }

    `matched=False` (industry text didn't confidently map to a dataset bucket)
    means the frontend should show an honest "no peer data" state — never a
    guessed one. Same rule benchmarks.py already follows for comparisons #4/#5.
    """
    bucket = _match_industry_bucket(data.industry)
    if not bucket or bucket not in INDUSTRY_FUNDING_BENCHMARK:
        return {
            "matched": False,
            "industry_bucket": None,
            "percentile_rank": 0,
            "market_stats": None,
            "peers": [],
        }

    peers_in_bucket = [p for p in PEER_STARTUPS if p["bucket"] == bucket]
    peer_amounts = [p["amount_usd"] for p in peers_in_bucket]

    nearest = sorted(peers_in_bucket, key=lambda p: abs(p["amount_usd"] - data.funding_raised))[:PEER_COUNT]
    peers_out = [
        {
            "name": p["name"],
            "amount_usd": p["amount_usd"],
            "year": p["year"],
            "delta_usd": round(p["amount_usd"] - data.funding_raised, 2),
        }
        for p in nearest
    ]

    stats = INDUSTRY_FUNDING_BENCHMARK[bucket]

    return {
        "matched": True,
        "industry_bucket": bucket,
        "percentile_rank": _percentile_rank(data.funding_raised, peer_amounts),
        "market_stats": {
            "n": stats["n"],
            "median": stats["median"],
            "p25": stats["p25"],
            "p75": stats["p75"],
        },
        "peers": peers_out,
    }
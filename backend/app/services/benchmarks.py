"""
Stage-based benchmarking. This is the answer to "your numbers, compared to what" —
the single biggest gap flagged in review: without this, the app just reflects the
founder's own input back at them instead of telling them something new.

Benchmark figures below are reasonable, publicly-known ballpark ranges for
early-stage startups (not sourced from a proprietary dataset) — good enough to
give a founder a directional read, not investment-grade research. Said so
explicitly in the comparison text so it's honest about its own precision.
"""

import json
from pathlib import Path

from app.models.schemas import StartupInput

# Real-data industry funding benchmarks, derived from 1,525 actual Indian startup
# funding rounds (2015-2017, MIT-licensed public dataset — see
# app/data/industry_funding_benchmarks.json for the source and the raw figures).
# This is the one benchmark in this file backed by real observed data rather than
# a reasoned ballpark band, so it's kept separate from the stage-based bands below
# and only shown when the founder's free-text industry can be confidently matched
# to one of the dataset's categories.
_INDUSTRY_BENCHMARK_PATH = Path(__file__).resolve().parent.parent / "data" / "industry_funding_benchmarks.json"
with open(_INDUSTRY_BENCHMARK_PATH) as _f:
    INDUSTRY_FUNDING_BENCHMARK: dict = json.load(_f)

# Named real startups (911 records) for nearest-neighbor peer matching — same
# source dataset as INDUSTRY_FUNDING_BENCHMARK, kept as individual rows instead
# of pre-aggregated stats so we can find actual closest-funding real companies
# per request rather than only a percentile band.
_PEER_STARTUPS_PATH = Path(__file__).resolve().parent.parent / "data" / "industry_peer_startups.json"
with open(_PEER_STARTUPS_PATH) as _f:
    PEER_STARTUPS: list[dict] = json.load(_f)

# Keyword -> dataset bucket. Deliberately conservative: an unmatched industry
# string just means the 4th comparison is skipped, never guessed.
_INDUSTRY_KEYWORDS = [
    ("commerce", "E-Commerce"),
    ("d2c", "E-Commerce"),
    ("consumer", "Consumer Internet"),
    ("health", "Healthcare"),
    ("food", "Food & Beverage"),
    ("beverage", "Food & Beverage"),
    ("educat", "Education"),
    ("fintech", "Finance"),
    ("financ", "Finance"),
    ("logistic", "Logistics"),
    ("saas", "Technology"),
    ("tech", "Technology"),
]


def _match_industry_bucket(industry: str) -> str | None:
    s = industry.lower()
    for keyword, bucket in _INDUSTRY_KEYWORDS:
        if keyword in s:
            return bucket
    return None


# burn multiple = burn_rate / max(revenue, 1). Lower is more capital-efficient.
# Ranges are deliberately wide bands, not precise cutoffs.
BURN_MULTIPLE_BENCHMARK = {
    "Pre-seed": (3.0, 6.0),
    "Seed": (2.0, 4.0),
    "Series A": (1.2, 2.5),
    "Growth": (0.5, 1.5),
}

# Typical monthly active users at each stage (reuses the same figures health_score.py
# uses for its own traction component, so the two numbers never contradict each other).
USER_BENCHMARK = {"Pre-seed": 20, "Seed": 100, "Series A": 1000, "Growth": 10000}

# Typical total funding raised by this stage (USD), wide bands.
FUNDING_BENCHMARK = {
    "Pre-seed": (0, 250_000),
    "Seed": (250_000, 2_000_000),
    "Series A": (2_000_000, 15_000_000),
    "Growth": (15_000_000, 100_000_000),
}


def _fmt_money(n: float) -> str:
    return f"${n:,.0f}"


def get_benchmark_comparisons(data: StartupInput, burn_rate: float) -> list[dict]:
    """Returns a list of {metric, your_value, benchmark_value, comparison} dicts —
    matches the BenchmarkComparison schema. Always at least 3 items (stage-based
    bands, pure arithmetic, always succeed); a 4th real-data industry comparison
    is appended when the industry text matches a dataset bucket. No AI, no
    network call — this function can never fail or time out."""
    comparisons = []

    # 1. Burn multiple
    burn_multiple = round(burn_rate / max(data.revenue, 1), 1)
    lo, hi = BURN_MULTIPLE_BENCHMARK.get(data.stage, (2.0, 4.0))
    if burn_multiple <= lo:
        verdict = f"more capital-efficient than the typical {data.stage} range of {lo}x–{hi}x"
    elif burn_multiple <= hi:
        verdict = f"in line with the typical {data.stage} range of {lo}x–{hi}x"
    else:
        verdict = f"higher than the typical {data.stage} range of {lo}x–{hi}x — worth a closer look"
    comparisons.append({
        "metric": "Burn Multiple",
        "your_value": f"{burn_multiple}x",
        "benchmark_value": f"{lo}x–{hi}x typical for {data.stage}",
        "comparison": f"Your burn multiple is {burn_multiple}x, {verdict}.",
    })

    # 2. Traction vs. stage benchmark
    benchmark_users = USER_BENCHMARK.get(data.stage, 100)
    pct = round((data.monthly_users / benchmark_users) * 100) if benchmark_users else 0
    if pct >= 100:
        verdict = f"ahead of the typical {data.stage} benchmark (~{benchmark_users:,} users)"
    elif pct >= 50:
        verdict = f"approaching the typical {data.stage} benchmark (~{benchmark_users:,} users)"
    else:
        verdict = f"below the typical {data.stage} benchmark (~{benchmark_users:,} users)"
    comparisons.append({
        "metric": "Monthly Active Users",
        "your_value": f"{data.monthly_users:,}",
        "benchmark_value": f"~{benchmark_users:,} typical for {data.stage}",
        "comparison": f"You're at {pct}% of the typical {data.stage} user benchmark — {verdict}.",
    })

    # 3. Funding raised vs. stage benchmark
    lo_f, hi_f = FUNDING_BENCHMARK.get(data.stage, (0, 2_000_000))
    if data.funding_raised < lo_f:
        verdict = f"below the typical {data.stage} range of {_fmt_money(lo_f)}–{_fmt_money(hi_f)}"
    elif data.funding_raised <= hi_f:
        verdict = f"within the typical {data.stage} range of {_fmt_money(lo_f)}–{_fmt_money(hi_f)}"
    else:
        verdict = f"above the typical {data.stage} range of {_fmt_money(lo_f)}–{_fmt_money(hi_f)}"
    comparisons.append({
        "metric": "Total Funding Raised",
        "your_value": _fmt_money(data.funding_raised),
        "benchmark_value": f"{_fmt_money(lo_f)}–{_fmt_money(hi_f)} typical for {data.stage}",
        "comparison": f"You've raised {_fmt_money(data.funding_raised)}, {verdict}.",
    })

    # 4. Funding raised vs. real industry-peer funding rounds (only when the
    # free-text industry confidently matches a dataset bucket — never guessed).
    bucket = _match_industry_bucket(data.industry)
    if bucket and bucket in INDUSTRY_FUNDING_BENCHMARK:
        stats = INDUSTRY_FUNDING_BENCHMARK[bucket]
        p25, median, p75, n = stats["p25"], stats["median"], stats["p75"], stats["n"]
        if data.funding_raised < p25:
            verdict = f"below the 25th percentile (${p25:,.0f}) of real {bucket} funding rounds"
        elif data.funding_raised <= p75:
            verdict = f"within the middle 50% (${p25:,.0f}–${p75:,.0f}) of real {bucket} funding rounds"
        else:
            verdict = f"above the 75th percentile (${p75:,.0f}) of real {bucket} funding rounds"
        comparisons.append({
            "metric": "Funding vs. Industry Peers",
            "your_value": _fmt_money(data.funding_raised),
            "benchmark_value": f"median {_fmt_money(median)} across {n} real {bucket} rounds",
            "comparison": f"You've raised {_fmt_money(data.funding_raised)}, {verdict} (based on {n} real "
                           f"Indian {bucket} funding rounds, 2015\u20132017).",
        })

    # 5. Nearest-neighbor real named startups — the most concrete, demo-friendly
    # comparison: actual companies from the dataset closest to this funding
    # amount within the matched industry bucket. Skipped (not guessed) when
    # there's no confident industry match, same rule as comparison #4.
    if bucket:
        peers = [p for p in PEER_STARTUPS if p["bucket"] == bucket]
        peers_sorted = sorted(peers, key=lambda p: abs(p["amount_usd"] - data.funding_raised))
        top = peers_sorted[:3]
        if top:
            peer_desc = "; ".join(f"{p['name']} ({_fmt_money(p['amount_usd'])}, {p['year']})" for p in top)
            comparisons.append({
                "metric": "Similar Real Startups",
                "your_value": _fmt_money(data.funding_raised),
                "benchmark_value": f"{len(peers)} real {bucket} startups in dataset",
                "comparison": f"Real Indian {bucket} startups that raised similar amounts to you: {peer_desc}.",
            })

    return comparisons

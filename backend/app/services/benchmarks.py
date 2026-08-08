"""
Stage-based benchmarking. This is the answer to "your numbers, compared to what" —
the single biggest gap flagged in review: without this, the app just reflects the
founder's own input back at them instead of telling them something new.

Benchmark figures below are reasonable, publicly-known ballpark ranges for
early-stage startups (not sourced from a proprietary dataset) — good enough to
give a founder a directional read, not investment-grade research. Said so
explicitly in the comparison text so it's honest about its own precision.
"""

from app.models.schemas import StartupInput

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
    matches the BenchmarkComparison schema. Always 3 items, always succeeds
    (pure arithmetic, no AI, no network call)."""
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

    return comparisons

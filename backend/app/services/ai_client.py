"""
Groq call via httpx.AsyncClient (Rules.md: never use `requests` inside an
async route). Endpoint is OpenAI-compatible (Chat Completions schema), so the
request/response shape below matches what you'd use for OpenAI/xAI too. Behavior
contract:
  1. Try once, JSON-mode, parse + validate.
  2. On failure, retry once with a stricter prompt suffix.
  3. On second failure OR timeout, fall back to a deterministic template built
     from the already-computed health-score numbers. /analyze must NEVER 500
     because the LLM had a bad moment.
"""

import json
import httpx
from app.config import settings
from app.models.schemas import StartupInput
from app.services.prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    STRICT_RETRY_SUFFIX,
    CHAT_SYSTEM_PROMPT,
    build_analysis_user_message,
    build_chat_user_message,
)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

REQUIRED_ANALYSIS_KEYS = {
    "business_summary", "top_risks", "growth_opportunities",
    "recommended_kpis", "action_plan_30_days",
}


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def _validate_analysis_shape(parsed: dict) -> bool:
    if not REQUIRED_ANALYSIS_KEYS.issubset(parsed.keys()):
        return False
    if not isinstance(parsed["top_risks"], list) or len(parsed["top_risks"]) == 0:
        return False
    if not isinstance(parsed["action_plan_30_days"], list) or len(parsed["action_plan_30_days"]) == 0:
        return False
    valid_priorities = {"Immediate", "High", "Medium", "Low"}
    for item in parsed["action_plan_30_days"]:
        if item.get("priority") not in valid_priorities:
            return False
    return True


def _deterministic_fallback(data: StartupInput, metrics: dict) -> dict:
    """
    Built purely from numbers already computed in health_score.py — no AI.
    This is what ships if Groq fails twice or times out, so /analyze always
    returns a complete, schema-correct response.
    """
    risk_level = metrics["risk_level"]
    return {
        "business_summary": (
            f"{data.startup_name} is a {data.stage}-stage {data.industry} company "
            f"with a health score of {metrics['health_score']}/100 and {risk_level.lower()} "
            f"overall risk. Runway is currently {metrics['runway_months']} months."
        ),
        "top_risks": [
            f"Runway of {metrics['runway_months']} months needs active monitoring",
            f"Burn rate of ${metrics['burn_rate']:,.0f}/month relative to revenue",
            data.problem_faced[:120] if data.problem_faced else "Founder-identified operational risk",
        ],
        "growth_opportunities": [
            "Validate pricing and packaging with recent customers",
            "Tighten customer acquisition cost tracking",
            "Formalize a weekly metrics review cadence",
        ],
        "recommended_kpis": ["Monthly Recurring Revenue", "Burn Multiple", "Customer Acquisition Cost"],
        "action_plan_30_days": [
            {"priority": "Immediate", "task": "Review current burn rate against runway"},
            {"priority": "High", "task": "Address the primary challenge: " + (data.problem_faced[:80] if data.problem_faced else "operational risk")},
            {"priority": "Medium", "task": "Set up a KPI tracking dashboard"},
            {"priority": "Low", "task": "Document current unit economics"},
        ],
    }


async def get_ai_analysis(data: StartupInput, metrics: dict) -> tuple[dict, bool]:
    """
    Returns (analysis_dict, ai_degraded). ai_degraded=True means the fallback
    was used — the route must set AnalysisResult.ai_degraded accordingly.
    """
    if not settings.groq_api_key:
        return _deterministic_fallback(data, metrics), True

    user_message = build_analysis_user_message(data, metrics)
    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}

    messages = [
        {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    async with httpx.AsyncClient(timeout=settings.groq_timeout_seconds) as client:
        for attempt in range(2):  # 1 initial try + 1 retry, per Rules.md
            try:
                response = await client.post(
                    GROQ_URL,
                    headers=headers,
                    json={
                        "model": settings.groq_model,
                        "messages": messages,
                        "temperature": 0.4,
                        "response_format": {"type": "json_object"},
                    },
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"]
                cleaned = _strip_code_fences(raw)
                parsed = json.loads(cleaned)

                if _validate_analysis_shape(parsed):
                    return parsed, False

                # shape invalid -> tighten prompt and retry
                messages.append({"role": "assistant", "content": raw})
                messages.append({"role": "user", "content": STRICT_RETRY_SUFFIX})

            except Exception as e:
                # Broad on purpose: a narrower tuple (TimeoutException/HTTPStatusError/
                # JSONDecodeError/KeyError) missed connection-level failures like
                # httpx.ConnectError, which would have propagated up and 500'd the
                # route — breaking the "never 500 because the LLM had a bad moment"
                # guarantee. Logged so failures are visible instead of silently
                # degrading with no trace.
                print("AI ERROR:", repr(e))
                if isinstance(e, httpx.HTTPStatusError):
                    print("AI ERROR BODY:", e.response.text)
                if attempt == 0:
                    continue  # let the loop retry once
                break  # second failure -> fall through to fallback

    return _deterministic_fallback(data, metrics), True


async def get_chat_reply(analysis_context: dict, question: str, history: list[dict] | None = None) -> str:
    """Chat failures degrade to a static apology string rather than a 500 - a
    broken chat reply shouldn't break the whole results page.

    `history` is prior turns as [{"role": "founder"|"ai", "text": str}, ...],
    oldest first — persisted chat memory (Rules.md chat-memory addendum), not
    just a single isolated question each time."""
    if not settings.groq_api_key:
        return "AI chat is temporarily unavailable. Please check back shortly."

    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Fold prior turns in as real conversation history, not just context text —
    # this is what makes the chat feel like an ongoing conversation instead of
    # a series of one-off Q&A calls that forget everything each time.
    for turn in (history or []):
        role = "assistant" if turn["role"] == "ai" else "user"
        messages.append({"role": role, "content": turn["text"]})

    messages.append({"role": "user", "content": build_chat_user_message(analysis_context, question)})

    try:
        async with httpx.AsyncClient(timeout=settings.groq_timeout_seconds) as client:
            response = await client.post(
                GROQ_URL,
                headers=headers,
                json={"model": settings.groq_model, "messages": messages, "temperature": 0.5},
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        # Same reasoning as get_ai_analysis: broadened from a narrow exception
        # tuple to catch connection-level failures too, and logged so the real
        # cause shows up in the server console instead of just the generic
        # apology string reaching the user.
        print("CHAT AI ERROR:", repr(e))
        if isinstance(e, httpx.HTTPStatusError):
            print("CHAT AI ERROR BODY:", e.response.text)
        return "I'm having trouble responding right now — please try asking again in a moment."
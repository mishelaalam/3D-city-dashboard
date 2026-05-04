"""
LLM route — interprets natural language building queries via Groq API.
Uses direct HTTP requests to avoid SDK version conflicts.
"""

import os
import json
import requests
from flask import Blueprint, jsonify, request

llm_bp = Blueprint("llm", __name__)

SYSTEM_PROMPT = """You are an urban data query engine for a Calgary 3D city dashboard.

The user will type a natural language query about buildings. Your ONLY job is to return
a JSON object describing filter rules. Do not add explanation or markdown — return raw JSON only.

Available building fields:
  - height_m, assessed_value, use_type, zoning, levels, year_built, address, name

Return a JSON object with any of these optional keys:
{
  "height_min": <number|null>, "height_max": <number|null>,
  "value_min": <number|null>, "value_max": <number|null>,
  "use_types": [<string>]|null, "zonings": [<string>]|null,
  "year_min": <number|null>, "year_max": <number|null>,
  "levels_min": <number|null>, "levels_max": <number|null>,
  "name_contains": <string|null>,
  "description": <string>
}

Examples:
  "show buildings over 100 metres" -> {"height_min": 100, "description": "Buildings taller than 100m"}
  "commercial buildings" -> {"use_types": ["Commercial"], "description": "Commercial buildings"}
  "reset" -> {"description": "Show all buildings"}
"""


@llm_bp.route("/query", methods=["POST"])
def query_buildings():
    body = request.get_json(silent=True) or {}
    user_query = (body.get("query") or "").strip()

    if not user_query:
        return jsonify({"error": "query field required"}), 400

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return jsonify({"error": "GROQ_API_KEY not configured"}), 500

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_query},
                ],
                "temperature": 0.1,
                "max_tokens": 512,
            },
            timeout=30,
        )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        filter_obj = json.loads(raw)
        return jsonify({"filter": filter_obj, "raw_response": raw})

    except json.JSONDecodeError as exc:
        return jsonify({"error": f"LLM returned invalid JSON: {exc}"}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
# ─────────────────────────────────────────────────────────────────────────────
# ATLAS Agent Logic — Python
# This file contains the tool definitions, tool executor, and agent loop.
# This is the Python equivalent of the agent code inside App.jsx.
# ─────────────────────────────────────────────────────────────────────────────

import json
import math
from datetime import datetime, timedelta

# ── Dynamic date helpers ──────────────────────────────────────────────────────
TODAY = datetime.today()

def days_ago(n):
    return TODAY - timedelta(days=n)

def fmt_date(d):
    return d.strftime("%a %b %-d")   # e.g. "Wed Jun 11"

def fmt_day(d, idx):
    if idx == 0: return "Today"
    if idx == 1: return "Yesterday"
    return d.strftime("%a")          # e.g. "Mon"

# ── Sleep history — always relative to today ──────────────────────────────────
SLEEP_RAW = [
    {"total": "5h 42m", "totalMins": 342, "deep": 25, "rem": 22, "core": 48, "awake": 5,  "hrv": 41, "hr": 58, "spo2": 97, "score": 62, "bedtime": "11:48 PM", "wake": "5:30 AM"},
    {"total": "6h 51m", "totalMins": 411, "deep": 22, "rem": 24, "core": 47, "awake": 7,  "hrv": 48, "hr": 56, "spo2": 98, "score": 74, "bedtime": "11:10 PM", "wake": "6:01 AM"},
    {"total": "7h 18m", "totalMins": 438, "deep": 28, "rem": 26, "core": 42, "awake": 4,  "hrv": 52, "hr": 55, "spo2": 98, "score": 84, "bedtime": "10:45 PM", "wake": "6:03 AM"},
    {"total": "5h 30m", "totalMins": 330, "deep": 18, "rem": 20, "core": 55, "awake": 7,  "hrv": 38, "hr": 61, "spo2": 96, "score": 55, "bedtime": "12:30 AM", "wake": "6:00 AM"},
    {"total": "6h 48m", "totalMins": 408, "deep": 24, "rem": 23, "core": 46, "awake": 7,  "hrv": 50, "hr": 57, "spo2": 97, "score": 72, "bedtime": "11:20 PM", "wake": "6:08 AM"},
    {"total": "7h 33m", "totalMins": 453, "deep": 30, "rem": 25, "core": 41, "awake": 4,  "hrv": 55, "hr": 54, "spo2": 99, "score": 88, "bedtime": "10:30 PM", "wake": "6:03 AM"},
    {"total": "6h 05m", "totalMins": 365, "deep": 20, "rem": 21, "core": 50, "awake": 9,  "hrv": 44, "hr": 59, "spo2": 97, "score": 65, "bedtime": "12:05 AM", "wake": "6:10 AM"},
]

SLEEP_HISTORY = [
    {**s, "date": fmt_date(days_ago(i)), "day": fmt_day(days_ago(i), i)}
    for i, s in enumerate(SLEEP_RAW)
]

# ── Nutrition data ────────────────────────────────────────────────────────────
MACROS_GOAL = {"protein": 180, "carbs": 250, "fats": 70, "calories": 2400}

LOGGED_FOODS = [
    {"name": "Chicken Breast (grilled)", "grams": 200, "per100": {"calories": 165, "protein": 31,  "carbs": 0,   "fats": 3.6}},
    {"name": "Brown Rice (cooked)",      "grams": 150, "per100": {"calories": 112, "protein": 2.6, "carbs": 23,  "fats": 0.9}},
    {"name": "Whole Egg",                "grams": 100, "per100": {"calories": 155, "protein": 13,  "carbs": 1.1, "fats": 11 }},
]

FOOD_DATABASE = [
    {"name": "Chicken Breast (grilled)", "per100": {"calories": 165, "protein": 31,  "carbs": 0,   "fats": 3.6}},
    {"name": "Brown Rice (cooked)",      "per100": {"calories": 112, "protein": 2.6, "carbs": 23,  "fats": 0.9}},
    {"name": "Paneer",                   "per100": {"calories": 265, "protein": 18,  "carbs": 1.2, "fats": 21 }},
    {"name": "Banana",                   "per100": {"calories": 89,  "protein": 1.1, "carbs": 23,  "fats": 0.3}},
    {"name": "Whey Protein (1 scoop)",   "per100": {"calories": 120, "protein": 24,  "carbs": 3,   "fats": 1.5}},
    {"name": "Oats (dry)",               "per100": {"calories": 389, "protein": 17,  "carbs": 66,  "fats": 7  }},
    {"name": "Greek Yogurt",             "per100": {"calories": 59,  "protein": 10,  "carbs": 3.6, "fats": 0.4}},
    {"name": "Sweet Potato (baked)",     "per100": {"calories": 90,  "protein": 2,   "carbs": 21,  "fats": 0.1}},
    {"name": "Almonds",                  "per100": {"calories": 579, "protein": 21,  "carbs": 22,  "fats": 50 }},
    {"name": "Whole Egg",                "per100": {"calories": 155, "protein": 13,  "carbs": 1.1, "fats": 11 }},
]


# ── Tool definitions (JSON schemas for Claude) ────────────────────────────────
AGENT_TOOLS = [
    {
        "name": "get_sleep_data",
        "description": (
            "Retrieves the user's sleep data from Apple HealthKit. "
            "Returns recent nights including duration, sleep stages, HRV, "
            "resting heart rate, SpO2, and sleep score. "
            "Call this when the user asks about sleep, recovery, HRV, or rest quality."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "nights": {
                    "type": "number",
                    "description": "How many past nights to retrieve (1-7). Default 1."
                }
            },
            "required": []
        }
    },
    {
        "name": "get_nutrition_data",
        "description": (
            "Returns the user's current nutrition log for today: all logged foods, "
            "grams consumed, and macro totals versus daily goals. "
            "Call this when the user asks about diet, macros, calories, or food intake."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "search_food",
        "description": (
            "Searches the nutrition database for a food item and returns macros per 100g. "
            "Call this when the user asks what macros a specific food has."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Food name to search, e.g. 'chicken breast' or 'banana'"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_workout_data",
        "description": (
            "Retrieves the user's recent workout history with exercises, sets, reps, "
            "weights, and total volume. "
            "Call this when the user asks about training, progress, or exercise history."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "sessions": {
                    "type": "number",
                    "description": "Number of recent sessions to retrieve (1-7)."
                }
            },
            "required": []
        }
    },
    {
        "name": "calculate_recovery_score",
        "description": (
            "Calculates a composite recovery score (0-100) using HRV, sleep duration, "
            "sleep stage quality, and recent training volume. "
            "Call this when the user asks if they should train, how recovered they are, "
            "or for a readiness assessment."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]


# ── Tool executor — reads from data above ─────────────────────────────────────
def execute_tool(tool_name, tool_input):
    """
    Executes the requested tool and returns a JSON string.
    This is the Python equivalent of executeTool() in App.jsx.
    """

    # ── get_sleep_data ──
    if tool_name == "get_sleep_data":
        n      = min(int(tool_input.get("nights", 1)), 7)
        nights = SLEEP_HISTORY[:n]
        avg_mins = round(sum(night["totalMins"] for night in nights) / len(nights))
        avg_hrv  = round(sum(night["hrv"]       for night in nights) / len(nights))
        return json.dumps({
            "requested_nights": n,
            "data": [
                {
                    "date":         night["date"],
                    "total_sleep":  night["total"],
                    "total_minutes":night["totalMins"],
                    "stages": {
                        "deep_pct":  night["deep"],
                        "rem_pct":   night["rem"],
                        "core_pct":  night["core"],
                        "awake_pct": night["awake"],
                    },
                    "hrv_ms":          night["hrv"],
                    "resting_hr_bpm":  night["hr"],
                    "spo2_pct":        night["spo2"],
                    "sleep_score":     night["score"],
                    "bedtime":         night["bedtime"],
                    "wake_time":       night["wake"],
                }
                for night in nights
            ],
            "avg_duration_mins": avg_mins,
            "avg_hrv":           avg_hrv,
            "source":            "Apple HealthKit",
        })

    # ── get_nutrition_data ──
    elif tool_name == "get_nutrition_data":
        totals = {"protein": 0.0, "carbs": 0.0, "fats": 0.0, "calories": 0.0}
        logged = []
        for food in LOGGED_FOODS:
            r = food["grams"] / 100
            p = round(food["per100"]["protein"]  * r)
            c = round(food["per100"]["carbs"]    * r)
            f = round(food["per100"]["fats"]     * r)
            k = round(food["per100"]["calories"] * r)
            logged.append({
                "name":      food["name"],
                "grams":     food["grams"],
                "protein_g": p, "carbs_g": c, "fats_g": f, "calories": k,
            })
            totals["protein"]  += p
            totals["carbs"]    += c
            totals["fats"]     += f
            totals["calories"] += k

        totals = {k: round(v) for k, v in totals.items()}
        return json.dumps({
            "date":         "Today",
            "logged_foods": logged,
            "totals":       totals,
            "goals":        MACROS_GOAL,
            "remaining": {
                "protein_g":  MACROS_GOAL["protein"]  - totals["protein"],
                "carbs_g":    MACROS_GOAL["carbs"]    - totals["carbs"],
                "fats_g":     MACROS_GOAL["fats"]     - totals["fats"],
                "calories":   MACROS_GOAL["calories"] - totals["calories"],
            }
        })

    # ── search_food ──
    elif tool_name == "search_food":
        query   = tool_input.get("query", "").lower()
        results = [f for f in FOOD_DATABASE if query in f["name"].lower()]
        if results:
            return json.dumps({"results": [{"name": f["name"], "per_100g": f["per100"]} for f in results]})
        return json.dumps({"results": [], "message": "No matching food found."})

    # ── get_workout_data ──
    elif tool_name == "get_workout_data":
        n        = int(tool_input.get("sessions", 3))
        sessions = [
            {
                "name": "Push Day", "date": "Today", "duration_min": 52,
                "source": "Manual", "total_volume_kg": 8240,
                "exercises": [
                    {"name": "Bench Press",     "sets": 4, "reps": 8,  "weight_kg": 80},
                    {"name": "Overhead Press",  "sets": 3, "reps": 8,  "weight_kg": 50},
                    {"name": "Lateral Raises",  "sets": 4, "reps": 15, "weight_kg": 10},
                ]
            },
            {
                "name": "10K Run", "date": "Yesterday", "duration_min": 54,
                "source": "Apple Watch", "kcal_burned": 520
            },
            {
                "name": "Pull Day", "date": fmt_day(days_ago(3), 3), "duration_min": 61,
                "source": "Manual", "total_volume_kg": 7100,
                "exercises": [
                    {"name": "Deadlift",    "sets": 4, "reps": 5,  "weight_kg": 120},
                    {"name": "Pull-ups",    "sets": 4, "reps": 8,  "weight_kg": 0  },
                    {"name": "Bicep Curls", "sets": 4, "reps": 12, "weight_kg": 16 },
                ]
            },
        ]
        return json.dumps({"sessions": sessions[:n]})

    # ── calculate_recovery_score ──
    elif tool_name == "calculate_recovery_score":
        last         = SLEEP_HISTORY[0]
        sleep_score  = last["score"]
        hrv_score    = 100 if last["hrv"] > 50 else (70 if last["hrv"] > 40 else 40)
        dur_score    = 100 if last["totalMins"] > 420 else (75 if last["totalMins"] > 360 else 50)
        load_score   = 40  if 8240 > 10000 else (70 if 8240 > 7000 else 90)
        composite    = round(sleep_score*0.30 + hrv_score*0.35 + dur_score*0.20 + load_score*0.15)

        if composite >= 80:
            label = "High — ready to push"
        elif composite >= 60:
            label = "Moderate — train at planned intensity"
        else:
            label = "Low — consider deload or rest"

        recommendation = (
            "Avoid heavy compound lifts today. Active recovery or a light session is preferable."
            if composite < 60 else
            "Recovery is adequate. Proceed with planned training."
        )

        return json.dumps({
            "recovery_score": composite,
            "label":          label,
            "breakdown": {
                "sleep_quality":           sleep_score,
                "hrv_component":           hrv_score,
                "duration_component":      dur_score,
                "training_load_component": load_score,
            },
            "recommendation": recommendation,
        })

    return json.dumps({"error": f"Unknown tool: {tool_name}"})


# ── Standalone agent loop (for testing without the web server) ────────────────
def run_agent(client, user_message):
    """
    Pure Python ReAct agent loop.
    Same architecture as the JavaScript version in App.jsx.
    perceive → reason → act → repeat until end_turn
    """
    messages = [{"role": "user", "content": user_message}]
    system   = (
        "You are ATLAS, an AI health agent for Vikhyaath "
        "(20yo AI/ML student, Bangalore). "
        "ALWAYS use tools to get real data before answering — never make up numbers. "
        "Reply in 2-4 sentences. Reference actual values from the tool results."
    )

    for iteration in range(5):   # max 5 tool-call iterations
        response = client.messages.create(
            model      = "claude-sonnet-4-20250514",
            max_tokens = 1024,
            system     = system,
            tools      = AGENT_TOOLS,
            messages   = messages,
        )

        # ── Model wants to call tools ──
        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"  → Agent calling tool: {block.name}")
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block.id,
                        "content":     result,
                    })

            messages.append({"role": "user", "content": tool_results})

        # ── Model has its final answer ──
        else:
            for block in response.content:
                if block.type == "text":
                    return block.text
            return "No response."

    return "Max iterations reached."


# ── Test the agent directly from command line ─────────────────────────────────
if __name__ == "__main__":
    import anthropic as _anthropic

    _client = _anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    print("\n" + "="*50)
    print("ATLAS Agent — Python Test")
    print("="*50)

    test_queries = [
        "How was my sleep last night?",
        "Should I train today?",
        "Help me hit my protein goal",
    ]

    for query in test_queries:
        print(f"\nQuery: {query}")
        print("ATLAS:", run_agent(_client, query))
        print("-"*50)

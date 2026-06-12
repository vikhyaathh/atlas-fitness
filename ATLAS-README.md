# ATLAS — Adaptive Tracking and Lifestyle AI System

> **An AI Agent for Personal Health Intelligence**
> B.M.S. College of Engineering · Department of Machine Learning
> 4th Semester AAT · Introduction to Artificial Intelligence (24AM7PWPW2)
> Student: Vikhyaath M (1BM24AI190) · Guide: Prof. Supriya P

---

## 🌐 Live Website

**[atlas-health-agent.vercel.app](https://atlas-health-agent.vercel.app)**

Open on any device — phone, tablet, laptop. No installation needed.

---

## What is ATLAS?

ATLAS is a personal health intelligence **AI agent** — not a chatbot. The distinction matters:

| | Chatbot with Context | AI Agent (ATLAS) |
|---|---|---|
| **How it gets data** | All data pre-loaded into system prompt | LLM *decides* which tool to call |
| **Decision-making** | None — you decided what to include | LLM autonomously chooses tools |
| **Multi-step reasoning** | Single prompt → single response | Chains multiple tool calls if needed |
| **Architecture** | Prompt engineering | ReAct loop (Yao et al., 2022) |

ATLAS implements the **perceive → reason → act** loop:

```
User query
    ↓
LLM receives query + tool schemas
    ↓
LLM reasons: "which tool do I need?"
    ↓
LLM calls tool  (e.g. get_sleep_data)
    ↓
App executes tool → returns real data
    ↓
LLM reads result → calls another tool if needed
    ↓
LLM produces grounded, data-specific answer
```

---

## The 5 Agent Tools

| Tool | When the agent calls it | What it returns |
|---|---|---|
| `get_sleep_data` | Any sleep / HRV / recovery query | N nights: duration, stages, HRV, HR, SpO2, score |
| `get_nutrition_data` | Any macro / calorie / diet query | Today's food log + totals vs goals |
| `search_food` | "What macros does X have?" | Per-100g macros for matching foods |
| `get_workout_data` | Training / volume / progress queries | Sessions with exercises, sets, reps, weight |
| `calculate_recovery_score` | "Should I train?" / readiness queries | Composite 0–100 score from HRV + sleep + load |

---

## Tech Stack

| Layer | Technology | Language |
|---|---|---|
| Frontend / UI | React + Vite | JavaScript |
| AI Agent Logic | Anthropic Claude API (tool_use) | JavaScript / Python |
| Backend Server | Flask | **Python** |
| Biometric Data | Apple HealthKit | iOS / Swift |
| Nutrition | USDA FoodData Central + Open Food Facts | REST API |
| Deployment | Vercel (frontend) | — |

---

## Project Structure

```
atlas-health-agent/
├── README.md               ← this file
├── .gitignore
├── .env.example
├── vercel.json             ← Vercel deployment config
│
├── package.json            ← React/Vite dependencies
├── vite.config.js          ← Vite build config
├── index.html              ← browser entry point
│
├── server.py               ← Python/Flask backend
├── agent.py                ← Python agent logic + 5 tools
├── requirements.txt        ← Python dependencies
│
├── src/
│   ├── main.jsx            ← React entry point
│   └── App.jsx             ← full ATLAS app (1400+ lines)
│
└── docs/
    └── ATLAS-Report.docx   ← AAT academic report
```

---

## Running Locally on Windows

### Prerequisites
- Node.js — download from nodejs.org
- Python 3.10+ — download from python.org
- Anthropic API key — from console.anthropic.com

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/atlas-health-agent
cd atlas-health-agent

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install JavaScript dependencies
npm install

# 4. Add your API key
# rename .env.example to .env
# open .env and paste your key
```

### Run

Open **two** Command Prompt windows:

**Window 1 — Python backend:**
```bash
python server.py
```
You will see: `✦ ATLAS Python backend running at http://localhost:3001`

**Window 2 — React frontend:**
```bash
npm run dev
```
You will see: `Local: http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## Deploying to Vercel (live website)

1. Push all files to GitHub
2. Go to **vercel.com** → sign in with GitHub
3. Click **New Project** → import `atlas-health-agent`
4. Vercel auto-detects Vite — settings are already correct
5. Click **Deploy**
6. Your live URL: `https://atlas-health-agent.vercel.app`

Every time you push to GitHub, Vercel automatically redeploys.

---

## Example Agent Interactions

**Query:** *"Should I train today?"*
```
ATLAS calls: calculate_recovery_score
      reads: HRV 41ms (↓12%), sleep 5h42m, volume 8,240kg
      score: 58/100 (Low)
ATLAS: "Your recovery score is 58 — below threshold. HRV is 12%
        below baseline and you only got 5h42m. Skip heavy compounds
        today and go for active recovery instead."
```

**Query:** *"Help me hit my protein goal"*
```
ATLAS calls: get_nutrition_data
      reads: Protein 142/180g, 38g remaining
ATLAS: "You're 38g short on protein. A whey shake (24g) plus
        150g Greek yogurt (15g) would close the gap exactly."
```

---

## SDGs Addressed

| SDG | How ATLAS addresses it |
|---|---|
| **SDG 3** Good Health | Translates biometric data into personalised AI health recommendations |
| **SDG 9** Innovation | Demonstrates LLM tool-use agent architecture in consumer health |
| **SDG 10** Reduced Inequalities | Free, open-data APIs — no subscriptions or expensive hardware needed |

---

## Academic References

1. Anthropic. *Claude API — Tool Use*. https://docs.anthropic.com/en/docs/tool-use
2. Yao, S. et al. (2022). *ReAct: Synergising Reasoning and Acting in Language Models*. arXiv:2210.03629
3. Russell, S. & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach*, 4th Ed.
4. Apple Inc. *HealthKit Framework*. https://developer.apple.com/healthkit/
5. USDA FoodData Central. https://fdc.nal.usda.gov

---

*ATLAS · BMSCE · Department of Machine Learning · 2025–26*

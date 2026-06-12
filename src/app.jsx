import { useState, useRef, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Josefin+Sans:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');`;

const C = {
  skyBlue:   "#87CEEB",
  skyMid:    "#5BA8CC",
  ocean:     "#0B3D5C",
  deep:      "#061E2E",
  deeper:    "#040F1A",
  rust:      "#C4622D",
  rustLight: "#E8895A",
  sand:      "#E8D5B0",
  sandLight: "#F5EDD8",
  sandDark:  "#A89880",
  surface:   "rgba(11,61,92,0.45)",
  border:    "rgba(135,206,235,0.13)",
};

const NAV = [
  { id:"home",      icon:"⬡", label:"Today"   },
  { id:"sleep",     icon:"◑", label:"Sleep"   },
  { id:"workout",   icon:"△", label:"Train"   },
  { id:"nutrition", icon:"◈", label:"Macros"  },
  { id:"ai",        icon:"✦", label:"ATLAS AI"  },
];

const sleepStages = [
  { label:"Awake", pct:5,  color:C.rust    },
  { label:"REM",   pct:22, color:C.skyBlue },
  { label:"Core",  pct:48, color:C.skyMid  },
  { label:"Deep",  pct:25, color:C.ocean   },
];

const macrosGoal = { protein:180, carbs:250, fats:70, calories:2400 };
const macrosColors = { protein:C.skyBlue, carbs:C.sand, fats:C.rust, calories:C.skyMid };

const SEED_FOODS = [
  { id:1, name:"Chicken Breast (grilled)", per100:{ calories:165, protein:31, carbs:0,  fats:3.6 }},
  { id:2, name:"Brown Rice (cooked)",      per100:{ calories:112, protein:2.6,carbs:23, fats:0.9 }},
  { id:3, name:"Whole Egg",                per100:{ calories:155, protein:13, carbs:1.1,fats:11  }},
  { id:4, name:"Paneer",                   per100:{ calories:265, protein:18, carbs:1.2,fats:21  }},
  { id:5, name:"Banana",                   per100:{ calories:89,  protein:1.1,carbs:23, fats:0.3 }},
  { id:6, name:"Whey Protein (1 scoop)",   per100:{ calories:120, protein:24, carbs:3,  fats:1.5 }},
  { id:7, name:"Oats (dry)",               per100:{ calories:389, protein:17, carbs:66, fats:7   }},
  { id:8, name:"Almonds",                  per100:{ calories:579, protein:21, carbs:22, fats:50  }},
  { id:9, name:"Greek Yogurt",             per100:{ calories:59,  protein:10, carbs:3.6,fats:0.4 }},
  { id:10,name:"Sweet Potato (baked)",     per100:{ calories:90,  protein:2,  carbs:21, fats:0.1 }},
];

const BARCODE_DB = {
  "8901058851427": { name:"Amul Butter", per100:{ calories:717, protein:0.5, carbs:0, fats:80 }},
  "8901719110085": { name:"Britannia NutriChoice", per100:{ calories:450, protein:9, carbs:65, fats:16 }},
  "0016000275188": { name:"Quaker Oats", per100:{ calories:375, protein:13, carbs:67, fats:7 }},
};


// ── Dynamic date helpers ────────────────────────────────────────────────────
const TODAY = new Date();
const DAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS= ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
}
function fmtDate(d) {
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function fmtDay(d, idx) {
  if (idx === 0) return "Today";
  if (idx === 1) return "Yesterday";
  return DAYS[d.getDay()];
}
function fmtHeader() {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return `${days[TODAY.getDay()]} · ${MONTHS[TODAY.getMonth()]} ${TODAY.getDate()}`;
}

// ── Sleep history — always relative to today ────────────────────────────────
const SLEEP_RAW = [
  { total:"5h 42m", totalMins:342, deep:25, rem:22, core:48, awake:5,  hrv:41, hr:58, spo2:97, score:62, bedtime:"11:48 PM", wake:"5:30 AM" },
  { total:"6h 51m", totalMins:411, deep:22, rem:24, core:47, awake:7,  hrv:48, hr:56, spo2:98, score:74, bedtime:"11:10 PM", wake:"6:01 AM" },
  { total:"7h 18m", totalMins:438, deep:28, rem:26, core:42, awake:4,  hrv:52, hr:55, spo2:98, score:84, bedtime:"10:45 PM", wake:"6:03 AM" },
  { total:"5h 30m", totalMins:330, deep:18, rem:20, core:55, awake:7,  hrv:38, hr:61, spo2:96, score:55, bedtime:"12:30 AM", wake:"6:00 AM" },
  { total:"6h 48m", totalMins:408, deep:24, rem:23, core:46, awake:7,  hrv:50, hr:57, spo2:97, score:72, bedtime:"11:20 PM", wake:"6:08 AM" },
  { total:"7h 33m", totalMins:453, deep:30, rem:25, core:41, awake:4,  hrv:55, hr:54, spo2:99, score:88, bedtime:"10:30 PM", wake:"6:03 AM" },
  { total:"6h 05m", totalMins:365, deep:20, rem:21, core:50, awake:9,  hrv:44, hr:59, spo2:97, score:65, bedtime:"12:05 AM", wake:"6:10 AM" },
];
const SLEEP_HISTORY = SLEEP_RAW.map((s, i) => {
  const d = daysAgo(i);
  return { ...s, date: fmtDate(d), day: fmtDay(d, i) };
});

// ── Health workouts — relative dates ───────────────────────────────────────
const HEALTH_WORKOUTS = [
  { id:"h1", name:"Outdoor Run",  source:"Apple Watch", date:"Yesterday",         duration:"54 min", kcal:520, exercises:[] },
  { id:"h2", name:"HIIT Workout", source:"Apple Watch", date:fmtDay(daysAgo(3),3), duration:"38 min", kcal:410, exercises:[] },
  { id:"h3", name:"Cycling",      source:"Apple Watch", date:fmtDay(daysAgo(5),5), duration:"65 min", kcal:490, exercises:[] },
];

const SEED_MSGS = [
  { role:"ai",   text:"Good morning, Vikhyaath. HRV at 41ms — down 12% from your baseline. Sleep was 5h42m with solid deep sleep at 25%. I'd keep today moderate intensity.", ts:"8:04 AM" },
  { role:"user", text:"What should I eat pre-workout?", ts:"8:06 AM" },
  { role:"ai",   text:"Fast carbs + moderate protein works best when sleep is compromised. Two bananas and a whey shake 30 min before. Skip fats pre-session — slow digestion when you're already fatigued.", ts:"8:06 AM" },
];

export default function App() {
  const [tab, setTab]     = useState("home");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({ name:"Vikhyaath", age:"20", weight:"72", height:"178", goal:"Build muscle & improve recovery" });
  const [chat, setChat]   = useState(SEED_MSGS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [loggedFoods, setLoggedFoods] = useState([
    { ...SEED_FOODS[0], grams:200 },
    { ...SEED_FOODS[1], grams:150 },
    { ...SEED_FOODS[2], grams:100 },
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chat, thinking]);

  const macroTotals = loggedFoods.reduce((acc, f) => {
    const m = f.per100;
    const r = f.grams / 100;
    acc.calories += m.calories * r;
    acc.protein  += m.protein  * r;
    acc.carbs    += m.carbs    * r;
    acc.fats     += m.fats     * r;
    return acc;
  }, { calories:0, protein:0, carbs:0, fats:0 });

  // ── ATLAS AGENT: tool definitions ──────────────────────────────────────────
  const AGENT_TOOLS = [
    {
      name: "get_sleep_data",
      description: "Retrieves the user's sleep data from Apple HealthKit. Returns recent nights including duration, sleep stages (deep/REM/core/awake percentages), HRV, resting heart rate, SpO2, and sleep score. Call this when the user asks about sleep, recovery, HRV, or anything related to rest quality.",
      input_schema: {
        type: "object",
        properties: {
          nights: { type: "number", description: "How many past nights to retrieve (1–7). Default 1 for last night, 7 for weekly view." }
        },
        required: []
      }
    },
    {
      name: "get_nutrition_data",
      description: "Returns the user's current nutrition log for today: all logged foods, grams consumed, and macro totals (protein, carbs, fats, calories) versus their daily goals. Call this when the user asks about diet, macros, calories, food intake, or nutrition advice.",
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "search_food",
      description: "Searches the nutrition database for a food item and returns its macros per 100g. Use this when the user asks what macros a specific food has, whether a food fits their goals, or wants to know the nutritional content of something.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Food name to search for, e.g. 'chicken breast' or 'banana'" }
        },
        required: ["query"]
      }
    },
    {
      name: "get_workout_data",
      description: "Retrieves the user's workout history. Returns recent training sessions with exercises, sets, reps, weights, total volume, and duration. Call this when the user asks about their training, progress, volume, or exercise history.",
      input_schema: {
        type: "object",
        properties: {
          sessions: { type: "number", description: "Number of recent sessions to retrieve (1–7)." }
        },
        required: []
      }
    },
    {
      name: "calculate_recovery_score",
      description: "Calculates a composite recovery score (0–100) using last night's HRV, sleep duration, sleep stage quality, and recent training volume. Returns a score with breakdown. Call this when the user asks if they should train, how recovered they are, or for a readiness assessment.",
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  // ── ATLAS AGENT: tool execution (reads from app state) ───────────────────
  function executeTool(toolName, toolInput, macroTotals) {
    if (toolName === "get_sleep_data") {
      const n = Math.min(toolInput.nights || 1, 7);
      const nights = SLEEP_HISTORY.slice(0, n);
      return JSON.stringify({
        requested_nights: n,
        data: nights.map(night => ({
          date: night.date,
          total_sleep: night.total,
          total_minutes: night.totalMins,
          stages: { deep_pct: night.deep, rem_pct: night.rem, core_pct: night.core, awake_pct: night.awake },
          hrv_ms: night.hrv,
          resting_hr_bpm: night.hr,
          spo2_pct: night.spo2,
          sleep_score: night.score,
          bedtime: night.bedtime,
          wake_time: night.wake
        })),
        avg_duration_mins: Math.round(nights.reduce((a,n)=>a+n.totalMins,0)/nights.length),
        avg_hrv: Math.round(nights.reduce((a,n)=>a+n.hrv,0)/nights.length),
        source: "Apple HealthKit"
      });
    }

    if (toolName === "get_nutrition_data") {
      return JSON.stringify({
        date: "Today",
        logged_foods: loggedFoods.map(f => ({
          name: f.name,
          grams: f.grams,
          protein_g: Math.round(f.per100.protein * f.grams/100),
          carbs_g: Math.round(f.per100.carbs * f.grams/100),
          fats_g: Math.round(f.per100.fats * f.grams/100),
          calories: Math.round(f.per100.calories * f.grams/100),
        })),
        totals: {
          protein_g: Math.round(macroTotals.protein),
          carbs_g: Math.round(macroTotals.carbs),
          fats_g: Math.round(macroTotals.fats),
          calories: Math.round(macroTotals.calories),
        },
        goals: macrosGoal,
        remaining: {
          protein_g: macrosGoal.protein - Math.round(macroTotals.protein),
          carbs_g: macrosGoal.carbs - Math.round(macroTotals.carbs),
          fats_g: macrosGoal.fats - Math.round(macroTotals.fats),
          calories: macrosGoal.calories - Math.round(macroTotals.calories),
        }
      });
    }

    if (toolName === "search_food") {
      const q = (toolInput.query || "").toLowerCase();
      const found = SEED_FOODS.filter(f => f.name.toLowerCase().includes(q));
      return JSON.stringify(found.length > 0
        ? { results: found.map(f => ({ name: f.name, per_100g: f.per100 })) }
        : { results: [], message: "No matching food found in local database." }
      );
    }

    if (toolName === "get_workout_data") {
      return JSON.stringify({
        sessions: [
          { name:"Push Day", date:"Today", duration_min:52, source:"Manual", total_volume_kg:8240, exercises:[
            { name:"Bench Press", sets:4, reps:8, weight_kg:80 },
            { name:"Overhead Press", sets:3, reps:8, weight_kg:50 },
            { name:"Lateral Raises", sets:4, reps:15, weight_kg:10 },
          ]},
          { name:"10K Run", date:"Yesterday", duration_min:54, source:"Apple Watch", kcal_burned:520 },
          { name:"Pull Day", date:"Mon", duration_min:61, source:"Manual", total_volume_kg:7100 },
        ].slice(0, toolInput.sessions || 3)
      });
    }

    if (toolName === "calculate_recovery_score") {
      const lastNight = SLEEP_HISTORY[0];
      const sleepScore = lastNight.score;
      const hrvScore = lastNight.hrv > 50 ? 100 : lastNight.hrv > 40 ? 70 : 40;
      const durationScore = lastNight.totalMins > 420 ? 100 : lastNight.totalMins > 360 ? 75 : 50;
      const volumeLoad = 8240;
      const loadScore = volumeLoad > 10000 ? 40 : volumeLoad > 7000 ? 70 : 90;
      const composite = Math.round((sleepScore*0.3 + hrvScore*0.35 + durationScore*0.2 + loadScore*0.15));
      return JSON.stringify({
        recovery_score: composite,
        label: composite >= 80 ? "High — ready to push" : composite >= 60 ? "Moderate — train at planned intensity" : "Low — consider deload or rest",
        breakdown: { sleep_quality: sleepScore, hrv_component: hrvScore, duration_component: durationScore, training_load_component: loadScore },
        recommendation: composite < 60 ? "Avoid heavy compound lifts today. Active recovery or a light session is preferable." : "Recovery is adequate. Proceed with planned training."
      });
    }

    return JSON.stringify({ error: "Unknown tool" });
  }

  // ── ATLAS LOCAL AGENT — runs entirely in-browser, no API needed ─────────────
  // Full ReAct loop: decide tools → execute → reason → respond
  // This is architecturally identical to the cloud version; Claude is replaced
  // by a local reasoning engine that makes the same tool-selection decisions.

  function decideTools(query) {
    const q = query.toLowerCase();
    const tools = [];
    if (q.match(/sleep|hrv|rest|recover|tired|resting|spo2|heart rate|bed|woke|night|week.*sleep|sleep.*week/))
      tools.push({ name:"get_sleep_data", input:{ nights: q.includes("week") ? 7 : 1 } });
    if (q.match(/train|workout|exercise|gym|session|lift|push|pull|volume|sets|reps|weight|strength/))
      tools.push({ name:"get_workout_data", input:{ sessions: 3 } });
    if (q.match(/recover|ready|should i|today.*train|train.*today|readiness|deload|rest day/))
      tools.push({ name:"calculate_recovery_score", input:{} });
    if (q.match(/eat|food|meal|macro|protein|carb|calorie|caloric|fat|nutrition|diet|intake/))
      tools.push({ name:"get_nutrition_data", input:{} });
    if (q.match(/what.*have|content|how much protein|how many cal|macro.*in|nutrition.*in/)) {
      const foodMatch = q.match(/protein in (.+)|calories in (.+)|macro.*in (.+)|how much.*in (.+)/);
      const foodQuery = foodMatch ? (foodMatch[1]||foodMatch[2]||foodMatch[3]||foodMatch[4]).trim() : "chicken breast";
      tools.push({ name:"search_food", input:{ query: foodQuery } });
    }
    if (tools.length === 0)
      tools.push({ name:"get_sleep_data", input:{ nights:1 } }, { name:"get_nutrition_data", input:{} });
    return tools;
  }

  function generateAnswer(query, toolResults) {
    const q = query.toLowerCase();
    const sleep    = toolResults.get_sleep_data;
    const nutrition= toolResults.get_nutrition_data;
    const recovery = toolResults.calculate_recovery_score;
    const workout  = toolResults.get_workout_data;
    const food     = toolResults.search_food;

    // Recovery / should I train
    if (recovery) {
      const score = recovery.recovery_score;
      const night = sleep?.data?.[0];
      const hrv   = night?.hrv_ms ?? 41;
      const dur   = night?.total_sleep ?? "5h 42m";
      const rec   = recovery.recommendation;
      if (score >= 75)
        return `Your recovery score is ${score}/100 — you're in good shape to train today. HRV is at ${hrv}ms and you got ${dur} of sleep. ${rec}`;
      if (score >= 55)
        return `Recovery score is ${score}/100 — moderate. HRV at ${hrv}ms and ${dur} sleep means you can train but keep intensity controlled. ${rec}`;
      return `Recovery score is ${score}/100 — low. Your HRV dropped to ${hrv}ms and you only got ${dur} last night. ${rec} Consider a light session or full rest.`;
    }

    // Sleep query
    if (sleep && !nutrition && !recovery) {
      const nights = sleep.data;
      if (nights.length === 1) {
        const n = nights[0];
        const label = n.sleep_score >= 80 ? "great" : n.sleep_score >= 65 ? "decent" : n.sleep_score >= 50 ? "fair" : "poor";
        return `Last night you got ${n.total_sleep} with a sleep score of ${n.sleep_score}/100 — ${label}. Deep sleep was ${n.stages.deep_pct}% and REM was ${n.stages.rem_pct}%, with HRV at ${n.hrv_ms}ms and resting HR ${n.resting_hr_bpm}bpm.`;
      }
      const avg = sleep.avg_duration_mins;
      const avgHours = Math.floor(avg/60);
      const avgMins  = avg % 60;
      const best  = [...nights].sort((a,b) => b.sleep_score - a.sleep_score)[0];
      const worst = [...nights].sort((a,b) => a.sleep_score - b.sleep_score)[0];
      return `Over the past 7 nights your average sleep is ${avgHours}h ${avgMins}m with an average HRV of ${sleep.avg_hrv}ms. Best night was ${best.date} (${best.total_sleep}, score ${best.sleep_score}) and worst was ${worst.date} (${worst.total_sleep}, score ${worst.sleep_score}).`;
    }

    // Nutrition / protein / macros
    if (nutrition && !recovery) {
      const t = nutrition.totals;
      const r = nutrition.remaining;
      const g = nutrition.goals;
      const pct = Math.round((t.protein_g / g.protein) * 100);
      if (q.includes("protein"))
        return `You've hit ${t.protein_g}g of protein today — ${pct}% of your ${g.protein}g goal, with ${r.protein_g}g still remaining. You've also logged ${t.calories} of your ${g.calories} calorie target.`;
      if (q.includes("calorie") || q.includes("caloric"))
        return `You're at ${t.calories} calories today out of your ${g.calories} target — ${r.calories} remaining. Macros: ${t.protein_g}g protein, ${t.carbs_g}g carbs, ${t.fats_g}g fats.`;
      return `Macros today: ${t.protein_g}/${g.protein}g protein, ${t.carbs_g}/${g.carbs_g !== undefined ? g.carbs : 250}g carbs, ${t.fats_g}/${g.fats !== undefined ? g.fats : 70}g fats, ${t.calories}/${g.calories} kcal. You still need ${r.protein_g}g protein and ${r.calories} calories to hit your targets.`;
    }

    // Food search
    if (food) {
      if (!food.results || food.results.length === 0)
        return `I couldn't find that food in the database. Try a more common name — for example "chicken breast", "brown rice", or "paneer".`;
      const f = food.results[0];
      const m = f.per_100g;
      return `${f.name} has ${m.protein}g protein, ${m.carbs}g carbs, ${m.fats}g fats, and ${m.calories} calories per 100g. ${m.protein > 20 ? "That's a solid high-protein option." : m.protein > 10 ? "Decent protein content." : "Low in protein — pair it with a higher-protein food."}`;
    }

    // Workout
    if (workout && !sleep) {
      const s = workout.sessions[0];
      return `Your last session was ${s.name} on ${s.date} — ${s.duration_min} minutes${s.total_volume_kg ? ` with ${s.total_volume_kg.toLocaleString()}kg total volume` : ""}. ${s.exercises?.length ? `You hit ${s.exercises.length} exercises including ${s.exercises[0].name} and ${s.exercises[1]?.name ?? ""}.` : ""}`;
    }

    // Pre-workout nutrition + recovery combined
    if (nutrition && sleep) {
      const n = sleep.data?.[0];
      const t = nutrition.totals;
      const r = nutrition.remaining;
      const hrv = n?.hrv_ms ?? 41;
      const dur = n?.total_sleep ?? "5h 42m";
      return `Given your ${dur} sleep and HRV at ${hrv}ms, keep pre-workout food light and fast-digesting. You're ${r.protein_g}g short on protein today — a whey shake (24g) and banana (27g carbs) 30 minutes before would top up energy without slowing digestion.`;
    }

    return `Based on your current data — sleep ${sleep?.data?.[0]?.total_sleep ?? "5h 42m"}, HRV ${sleep?.data?.[0]?.hrv_ms ?? 41}ms, and ${nutrition?.totals?.calories ?? 1840} calories logged — you're making solid progress. Prioritise hitting your protein target today.`;
  }

  async function showToolCall(name, now) {
    setChat(prev => {
      if (prev.some(m => m.toolCall === name)) return prev;
      return [...prev, { role:"tool", toolCall:name, ts:now, text:`Called: ${name.replace(/_/g," ")}` }];
    });
    await new Promise(r => setTimeout(r, 500));
  }

  async function send() {
    if (!input.trim() || loading) return;
    const now = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const userMsg = { role:"user", text:input, ts:now };
    setChat(prev => [...prev, userMsg]);
    const query = input;
    setInput("");

    // ── Step 1: THINK ──
    setThinking(true);
    await new Promise(r => setTimeout(r, 700));
    setThinking(false);
    setLoading(true);

    try {
      // ── Step 2: DECIDE which tools are needed ──
      const toolsNeeded = decideTools(query);

      // ── Step 3: EXECUTE each tool, show steps in UI ──
      const toolResults = {};
      for (const tool of toolsNeeded) {
        await showToolCall(tool.name, now);
        const raw = executeTool(tool.name, tool.input, macroTotals);
        toolResults[tool.name] = JSON.parse(raw);
        await new Promise(r => setTimeout(r, 400));
      }

      // ── Step 4: REASON over results and generate answer ──
      await new Promise(r => setTimeout(r, 300));
      const answer = generateAnswer(query, toolResults);

      setChat(prev => [...prev, { role:"ai", text:answer, ts:now }]);
    } catch(e) {
      setChat(prev => [...prev, { role:"ai", text:"Something went wrong — try again.", ts:now }]);
    }
    setLoading(false);
  }

  const wrap = {
    fontFamily:"'Josefin Sans', sans-serif",
    background: C.deep,
    color: C.sand,
    minHeight:"100vh",
    maxWidth:420,
    margin:"0 auto",
    display:"flex",
    flexDirection:"column",
    position:"relative",
  };

  return (
    <>
      <style>{FONTS + `
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: ${C.sandDark}; font-family: 'Cormorant Garamond', serif; font-style: italic; }
        ::-webkit-scrollbar { display: none; }
        @keyframes arqpulse { 0%,100%{transform:translateY(0);opacity:0.35} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        @keyframes slideup { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={wrap}>
        {/* Header */}
        <div style={{ padding:"20px 22px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div
              onClick={() => setTab("ai")}
              style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:32, letterSpacing:8, color:C.skyBlue, cursor:"pointer", userSelect:"none", lineHeight:1, textTransform:"uppercase" }}
            >
              AT<span style={{ color:C.rust }}>LAS</span>
            </div>
          </div>
          <div style={{ textAlign:"right", cursor:"pointer" }} onClick={() => setShowProfile(true)}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${C.ocean},${C.rust})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:C.sandLight, border:`1.5px solid ${C.skyBlue}55`, marginLeft:"auto" }}>V</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:11, letterSpacing:3, color:C.sandLight, marginTop:4, textTransform:"uppercase" }}>Vikhyaath</div>
          </div>
        </div>

        {/* Page title */}
        <div style={{ padding:"14px 22px 0" }}>
          <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:13, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.9 }}>
            { {home:fmtHeader(), sleep:"Sleep Analysis", workout:"Training", nutrition:"Nutrition", ai:"ATLAS Intelligence"}[tab] }
          </div>
          <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:26, fontWeight:700, color:C.sandLight, marginTop:2 }}>
            { {home:"Overview", sleep:"Sleep", workout:"Training", nutrition:"Macros", ai:"Ask ATLAS"}[tab] }
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 90px" }}>
          {tab === "home"      && <HomeTab setTab={setTab} macroTotals={macroTotals} />}
          {tab === "sleep"     && <SleepTab />}
          {tab === "workout"   && <WorkoutTab />}
          {tab === "nutrition" && <NutritionTab loggedFoods={loggedFoods} setLoggedFoods={setLoggedFoods} macroTotals={macroTotals} />}
          {tab === "ai"        && <AITab chat={chat} input={input} setInput={setInput} send={send} loading={loading} thinking={thinking} chatEndRef={chatEndRef} />}
        </div>

        {/* Nav */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:420, background:`${C.deeper}f0`, backdropFilter:"blur(20px)", borderTop:`1px solid ${C.skyBlue}1a`, display:"flex", padding:"10px 0 18px", zIndex:10 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color: tab === n.id ? C.skyBlue : C.sandDark, transition:"color 0.2s" }}>
              <span style={{ fontSize:17 }}>{n.icon}</span>
              <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, textTransform:"uppercase" }}>{n.label}</span>
            </button>
          ))}
        </div>

        {/* Profile overlay */}
        {showProfile && <ProfileOverlay profile={profile} setProfile={setProfile} onClose={() => setShowProfile(false)} />}
      </div>
    </>
  );
}

/* ─── Shared primitives ─── */
const Card = ({ children, style={} }) => (
  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:15, marginBottom:11, ...style }}>{children}</div>
);
const Lbl = ({ children }) => (
  <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.8, marginBottom:7 }}>{children}</div>
);
const Body = ({ children, style={} }) => (
  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:C.sandDark, lineHeight:1.6, ...style }}>{children}</div>
);
const Num = ({ children, style={} }) => (
  <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontWeight:700, ...style }}>{children}</div>
);

/* ─── HOME ─── */
function HomeTab({ setTab, macroTotals }) {
  const cals = Math.round(macroTotals.calories);
  return (
    <div>
      <div onClick={() => setTab("ai")} style={{ background:`linear-gradient(135deg,${C.ocean}aa,${C.rust}44)`, border:`1px solid ${C.skyBlue}44`, borderRadius:18, padding:"15px 16px", marginBottom:12, cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:C.deeper, border:`1.5px solid ${C.skyBlue}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:12, color:C.skyBlue, letterSpacing:2, flexShrink:0 }}>ATLAS</div>
        <div>
          <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2.5, color:C.skyBlue, marginBottom:4 }}>TODAY'S INSIGHT</div>
          <Body style={{ fontSize:14, color:C.sandLight, fontStyle:"italic" }}>HRV down 12% — keep today moderate. You're {macrosGoal.protein - Math.round(macroTotals.protein)}g short on protein.</Body>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:11 }}>
        {[
          { label:"Sleep",  val:"5h 42m",      sub:"↓ 32min vs avg",   color:C.skyBlue, icon:"◑", dest:"sleep"     },
          { label:"HRV",    val:"41 ms",        sub:"↓ 12% last night", color:C.rust,    icon:"♡", dest:"sleep"     },
          { label:"Volume", val:"8,240",        sub:"kg · Push Day",    color:"#5BC99A", icon:"△", dest:"workout"   },
          { label:"Cals",   val:`${cals}`,      sub:`${macrosGoal.calories - cals} remaining`, color:C.sandDark, icon:"◈", dest:"nutrition" },
        ].map(s => (
          <div key={s.label} onClick={() => setTab(s.dest)} style={{ background:`${C.ocean}44`, border:`1px solid ${C.border}`, borderRadius:14, padding:14, cursor:"pointer", transition:"border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${C.skyBlue}44`}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:16, color:s.color }}>{s.icon}</div>
              <div style={{ fontSize:9, color:C.sandDark, opacity:0.5 }}>→</div>
            </div>
            <Lbl>{s.label}</Lbl>
            <Num style={{ fontSize:26, letterSpacing:-0.5, color:C.sandLight }}>{s.val}</Num>
            <Body style={{ fontSize:12, marginTop:2 }}>{s.sub}</Body>
          </div>
        ))}
      </div>
      <Card>
        <Lbl>7-Day Sleep</Lbl>
        <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:52 }}>
          {[6.2,7.1,5.5,6.8,7.3,6.0,5.7].map((h,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:"100%", height:h*7, background: i===6 ? C.skyBlue : `${C.skyBlue}44`, borderRadius:4 }} />
              <Body style={{ fontSize:9, letterSpacing:1 }}>{["M","T","W","T","F","S","T"][i]}</Body>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ cursor:"pointer" }} onClick={() => setTab("nutrition")}>
        <Lbl>Macros Today</Lbl>
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(macrosGoal).map(([k,goal]) => {
            const val = Math.round(macroTotals[k]);
            return (
              <div key={k} style={{ flex:1 }}>
                <div style={{ height:3, background:`${C.skyBlue}22`, borderRadius:2, marginBottom:5 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(val/goal)*100)}%`, background:macrosColors[k], borderRadius:2 }} />
                </div>
                <Body style={{ fontSize:9 }}>{k.charAt(0).toUpperCase()+k.slice(1)}</Body>
                <Num style={{ fontSize:12, color:macrosColors[k] }}>{val}<span style={{ fontSize:8, color:C.sandDark }}>/{goal}</span></Num>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─── SLEEP ─── */

function SleepTab() {
  const [connected, setConnected] = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [selected, setSelected]   = useState(null);

  const night = selected !== null ? SLEEP_HISTORY[selected] : SLEEP_HISTORY[0];
  const scoreColor = night.score >= 80 ? "#34d399" : night.score >= 65 ? C.skyBlue : night.score >= 50 ? C.sand : C.rust;
  const scoreLabel = night.score >= 80 ? "Great" : night.score >= 65 ? "Good" : night.score >= 50 ? "Fair" : "Poor";

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  }

  if (!connected) {
    return (
      <div>
        <Card style={{ textAlign:"center", padding:"30px 20px" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>◑</div>
          <Lbl>Apple HealthKit</Lbl>
          <Num style={{ fontSize:18, color:C.sandLight, marginBottom:8 }}>Connect Sleep Tracking</Num>
          <Body style={{ textAlign:"center", lineHeight:1.8, marginBottom:20 }}>
            ATLAS reads your sleep data directly from Apple Health — including sleep stages, HRV, resting heart rate, and SpO2 from your Apple Watch.
          </Body>
          <div style={{ background:`${C.deeper}aa`, borderRadius:12, padding:"12px 14px", marginBottom:20, textAlign:"left" }}>
            {["Sleep stages (Awake, REM, Core, Deep)","Heart Rate Variability (HRV)","Resting Heart Rate","Blood Oxygen (SpO2)","Respiratory Rate"].map((p,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom: i < 4 ? 8 : 0 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:C.skyBlue, flexShrink:0 }} />
                <Body style={{ fontSize:12 }}>{p}</Body>
              </div>
            ))}
          </div>
          <button onClick={() => setConnected(true)} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.skyMid},${C.ocean})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:11, letterSpacing:3, cursor:"pointer" }}>
            CONNECT APPLE HEALTH
          </button>
          <Body style={{ fontSize:11, marginTop:10, textAlign:"center", fontStyle:"italic" }}>Opens Health app permissions on your iPhone</Body>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Status bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, padding:"0 2px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: syncing ? C.sand : "#34d399", animation: syncing ? "shimmer 0.8s infinite" : "none" }} />
          <Body style={{ fontSize:11, letterSpacing:1 }}>{syncing ? "Syncing from Health…" : "Apple Health · Live"}</Body>
        </div>
        <button onClick={handleSync} style={{ background:"none", border:`1px solid ${C.skyBlue}33`, borderRadius:8, padding:"4px 10px", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>
          {syncing ? "…" : "SYNC"}
        </button>
      </div>

      {/* 7-day bar selector */}
      <Card style={{ padding:"14px 14px 10px" }}>
        <Lbl>7-Day History — tap a night</Lbl>
        <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:58 }}>
          {SLEEP_HISTORY.slice().reverse().map((n, i) => {
            const idx = SLEEP_HISTORY.length - 1 - i;
            const isSelected = (selected === null ? 0 : selected) === idx;
            const h = (n.totalMins / 480) * 52;
            const col = n.score >= 80 ? "#34d399" : n.score >= 65 ? C.skyBlue : n.score >= 50 ? C.sand : C.rust;
            return (
              <div key={i} onClick={() => setSelected(idx)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
                <div style={{ width:"100%", height:h, background: isSelected ? col : `${col}55`, borderRadius:4, border: isSelected ? `1px solid ${col}` : "none", transition:"all 0.2s" }} />
                <Body style={{ fontSize:9, letterSpacing:0.5, color: isSelected ? C.sandLight : C.sandDark }}>{n.day.slice(0,3)}</Body>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected night hero */}
      <Card style={{ padding:"18px 16px", background:`linear-gradient(135deg,${C.ocean}88,${C.deeper})` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <Body style={{ fontSize:10, letterSpacing:2, marginBottom:4 }}>{night.date}</Body>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:44, letterSpacing:-2, color:C.skyBlue, lineHeight:1 }}>{night.total}</div>
            <Body style={{ marginTop:4, fontSize:12 }}>{night.bedtime} → {night.wake}</Body>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:`conic-gradient(${scoreColor} 0% ${night.score}%, ${C.ocean}99 ${night.score}% 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:C.deeper, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:scoreColor, lineHeight:1 }}>{night.score}</span>
              </div>
            </div>
            <Body style={{ fontSize:10, color:scoreColor, marginTop:4 }}>{scoreLabel}</Body>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          {[{l:"HRV",v:`${night.hrv}ms`},{l:"Resting HR",v:`${night.hr} bpm`},{l:"SpO2",v:`${night.spo2}%`}].map((s,i,arr) => (
            <div key={s.l} style={{ flex:1, textAlign:"center", borderRight: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
              <Body style={{ fontSize:10, letterSpacing:1 }}>{s.l}</Body>
              <Num style={{ fontSize:15, color:C.sandLight, marginTop:2 }}>{s.v}</Num>
            </div>
          ))}
        </div>
      </Card>

      {/* Sleep stages */}
      <Card>
        <Lbl>Sleep Stages</Lbl>
        <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", marginBottom:14 }}>
          {[{pct:night.awake,color:C.rust},{pct:night.rem,color:C.skyBlue},{pct:night.core,color:C.skyMid},{pct:night.deep,color:C.ocean}].map((s,i) => (
            <div key={i} style={{ width:`${s.pct}%`, background:s.color }} />
          ))}
        </div>
        {[{label:"Awake",pct:night.awake,color:C.rust},{label:"REM",pct:night.rem,color:C.skyBlue},{label:"Core",pct:night.core,color:C.skyMid},{label:"Deep",pct:night.deep,color:C.ocean}].map(s => (
          <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:s.color }} />
              <Body>{s.label}</Body>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:60, height:3, background:`${C.skyBlue}18`, borderRadius:2 }}>
                <div style={{ height:"100%", width:`${s.pct}%`, background:s.color, borderRadius:2 }} />
              </div>
              <Body style={{ width:30, textAlign:"right" }}>{s.pct}%</Body>
            </div>
          </div>
        ))}
      </Card>

      {/* Disconnect */}
      <button onClick={() => setConnected(false)} style={{ width:"100%", padding:"10px", borderRadius:10, border:`1px solid ${C.rust}44`, background:"transparent", color:C.rust, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer", marginTop:4 }}>
        DISCONNECT APPLE HEALTH
      </button>
    </div>
  );
}

/* ─── WORKOUT ─── */
const EXERCISE_LIST = [
  "Bench Press","Incline DB Press","Overhead Press","Lateral Raises","Tricep Pushdown","Chest Fly",
  "Deadlift","Pull-ups","Barbell Row","Seated Row","Face Pulls","Bicep Curls","Hammer Curls",
  "Squat","Leg Press","Leg Curl","Leg Extension","Hip Thrust","Calf Raises",
  "Plank","Cable Crunch","Russian Twist","Push-ups","Dips",
];



/* Shared set-entry panel used by both Log and Edit modes */
function ExerciseLogger({ exercises, setExercises, unit, activeExIdx, setActiveExIdx }) {
  const [showExSearch, setShowExSearch] = useState(false);
  const [exQuery, setExQuery]           = useState("");

  const kgToLbs = v => Math.round(v * 2.205 * 10) / 10;
  const lbsToKg = v => Math.round(v / 2.205 * 10) / 10;
  const displayW = kg => unit === "kg" ? kg : kgToLbs(kg);
  const storeW   = val => unit === "kg" ? parseFloat(val)||0 : lbsToKg(parseFloat(val)||0);

  function addExercise(name) {
    setExercises(prev => { const n = [...prev, { name, sets:[] }]; setActiveExIdx(n.length-1); return n; });
    setShowExSearch(false); setExQuery("");
  }
  function addSet(ei) {
    setExercises(arr => arr.map((ex,i) => {
      if (i !== ei) return ex;
      const last = ex.sets[ex.sets.length-1];
      return { ...ex, sets:[...ex.sets, { reps: last?.reps||10, weight: last?.weight||60, done:false }] };
    }));
  }
  function updateSet(ei, si, field, val) {
    setExercises(arr => arr.map((ex,i) => i!==ei ? ex : {
      ...ex, sets: ex.sets.map((s,j) => j!==si ? s : { ...s, [field]: field==="done" ? val : field==="reps" ? parseInt(val)||0 : storeW(val) })
    }));
  }
  function removeSet(ei, si) {
    setExercises(arr => arr.map((ex,i) => i!==ei ? ex : { ...ex, sets: ex.sets.filter((_,j)=>j!==si) }));
  }
  function removeExercise(ei) {
    setExercises(arr => arr.filter((_,i)=>i!==ei));
    if (activeExIdx===ei) setActiveExIdx(null);
  }

  return (
    <div>
      {exercises.map((ex, ei) => (
        <div key={ei} style={{ marginBottom:10 }}>
          <div onClick={() => setActiveExIdx(activeExIdx===ei ? null : ei)}
            style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:`${C.ocean}66`, borderRadius: activeExIdx===ei ? "12px 12px 0 0" : 12, border:`1px solid ${C.skyBlue}22`, cursor:"pointer" }}>
            <Num style={{ fontSize:15, color:C.sandLight }}>{ex.name}</Num>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Body style={{ fontSize:11, color:C.skyBlue }}>{ex.sets.length} sets</Body>
              <button onClick={e=>{ e.stopPropagation(); removeExercise(ei); }} style={{ background:"none", border:"none", color:C.rust, fontSize:18, cursor:"pointer", padding:0, lineHeight:1 }}>×</button>
            </div>
          </div>
          {activeExIdx === ei && (
            <div style={{ background:`${C.deeper}cc`, borderRadius:"0 0 12px 12px", border:`1px solid ${C.skyBlue}22`, borderTop:"none", padding:"10px 12px" }}>
              <div style={{ display:"flex", gap:8, marginBottom:8, padding:"0 4px" }}>
                <Body style={{ fontSize:9, letterSpacing:2, width:28 }}>SET</Body>
                <Body style={{ fontSize:9, letterSpacing:2, flex:1, textAlign:"center" }}>REPS</Body>
                <Body style={{ fontSize:9, letterSpacing:2, flex:1, textAlign:"center" }}>{unit.toUpperCase()}</Body>
                <Body style={{ fontSize:9, letterSpacing:2, flex:1, textAlign:"center" }}>VOL</Body>
                <div style={{ width:48 }} />
              </div>
              {ex.sets.map((s, si) => {
                const vol = s.reps * s.weight;
                return (
                  <div key={si} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:7, animation:"fadein 0.2s ease" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background: s.done ? `${C.skyBlue}33` : `${C.ocean}88`, border:`1px solid ${s.done ? C.skyBlue : C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Body style={{ fontSize:11, color: s.done ? C.skyBlue : C.sandDark }}>{si+1}</Body>
                    </div>
                    <input type="number" value={s.reps} onChange={e=>updateSet(ei,si,"reps",e.target.value)}
                      style={{ flex:1, background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}22`, borderRadius:8, color:C.sandLight, padding:"7px 4px", fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }} />
                    <input type="number" value={displayW(s.weight)} onChange={e=>updateSet(ei,si,"weight",e.target.value)}
                      style={{ flex:1, background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}22`, borderRadius:8, color:C.skyBlue, padding:"7px 4px", fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }} />
                    <Body style={{ flex:1, textAlign:"center", fontSize:11, color:C.sandDark }}>{(unit==="kg" ? vol : kgToLbs(vol)).toFixed(0)}{unit}</Body>
                    <div style={{ display:"flex", gap:4, width:48 }}>
                      <button onClick={()=>updateSet(ei,si,"done",!s.done)} style={{ width:22, height:22, borderRadius:"50%", border:`1px solid ${s.done ? "#34d399" : C.border}`, background: s.done ? "#34d39922" : "transparent", color:"#34d399", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✓</button>
                      <button onClick={()=>removeSet(ei,si)} style={{ width:22, height:22, borderRadius:"50%", border:`1px solid ${C.rust}44`, background:"transparent", color:C.rust, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>addSet(ei)} style={{ width:"100%", padding:"8px", borderRadius:8, border:`1px dashed ${C.skyBlue}33`, background:"transparent", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer", marginTop:6 }}>
                + ADD SET
              </button>
            </div>
          )}
        </div>
      ))}

      {showExSearch ? (
        <Card style={{ padding:"12px 14px" }}>
          <input autoFocus value={exQuery} onChange={e=>setExQuery(e.target.value)} placeholder="Search exercise…"
            style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}33`, borderRadius:10, color:C.sand, padding:"10px 13px", fontFamily:"'Cormorant Garamond',serif", fontSize:15, outline:"none", marginBottom:10 }} />
          <div style={{ maxHeight:180, overflowY:"auto" }}>
            {EXERCISE_LIST.filter(e => !exQuery || e.toLowerCase().includes(exQuery.toLowerCase())).map(e => (
              <div key={e} onClick={()=>addExercise(e)} style={{ padding:"9px 10px", borderRadius:8, cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:C.sand, marginBottom:2 }}
                onMouseEnter={ev=>ev.currentTarget.style.background=`${C.skyBlue}18`}
                onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>{e}</div>
            ))}
          </div>
          <button onClick={()=>setShowExSearch(false)} style={{ width:"100%", marginTop:8, padding:9, borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>CANCEL</button>
        </Card>
      ) : (
        <button onClick={()=>setShowExSearch(true)} style={{ width:"100%", padding:"11px", borderRadius:11, border:`1px dashed ${C.skyBlue}44`, background:"transparent", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer", marginBottom:10 }}>
          + ADD EXERCISE
        </button>
      )}
    </div>
  );
}

function WorkoutTab() {
  const [view, setView]           = useState("history");
  const [selected, setSelected]   = useState(null);   // { src:"manual"|"health", idx:N }
  const [editingId, setEditingId] = useState(null);   // id of saved workout being edited
  const [unit, setUnit]           = useState("kg");
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [activeExIdx, setActiveExIdx] = useState(null);
  const [saved, setSaved]         = useState([]);

  // edit draft state
  const [editName, setEditName]       = useState("");
  const [editExercises, setEditExercises] = useState([]);
  const [editActiveEx, setEditActiveEx]   = useState(null);

  const kgToLbs    = v => Math.round(v * 2.205 * 10) / 10;
  const totalVol   = exArr => exArr.reduce((a,ex) => a + ex.sets.reduce((b,s) => b + s.reps*s.weight, 0), 0);
  const volDisplay = exArr => unit==="kg" ? `${totalVol(exArr).toLocaleString()} kg` : `${kgToLbs(totalVol(exArr)).toLocaleString()} lbs`;

  function saveWorkout() {
    if (!sessionName.trim() && exercises.length===0) return;
    const w = { id:Date.now(), name:sessionName||"Untitled", date:"Just now", duration:"—", exercises:[...exercises], unit };
    setSaved(prev => [w, ...prev]);
    setSessionName(""); setExercises([]); setActiveExIdx(null);
    setView("history");
  }

  function startEdit(w) {
    setEditingId(w.id);
    setEditName(w.name);
    setEditExercises(JSON.parse(JSON.stringify(w.exercises)));
    setEditActiveEx(null);
  }

  function saveEdit() {
    setSaved(prev => prev.map(w => w.id!==editingId ? w : { ...w, name:editName, exercises:editExercises }));
    setEditingId(null);
    setSelected(null);
  }

  function deleteWorkout(id) {
    setSaved(prev => prev.filter(w => w.id!==id));
    setSelected(null);
  }

  /* ── DETAIL VIEW ── */
  if (selected !== null) {
    const isSaved  = selected.src === "manual";
    const w        = isSaved ? saved.find(w=>w.id===selected.id) : HEALTH_WORKOUTS.find(w=>w.id===selected.id);
    if (!w) { setSelected(null); return null; }
    const isEditing = editingId === w.id;

    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <button onClick={()=>{ setSelected(null); setEditingId(null); }} style={{ background:"none", border:"none", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer", padding:0 }}>← BACK</button>
          {isSaved && !isEditing && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>startEdit(w)} style={{ background:`${C.skyBlue}18`, border:`1px solid ${C.skyBlue}44`, borderRadius:8, padding:"5px 13px", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>EDIT</button>
              <button onClick={()=>deleteWorkout(w.id)} style={{ background:`${C.rust}18`, border:`1px solid ${C.rust}44`, borderRadius:8, padding:"5px 13px", color:C.rust, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>DELETE</button>
            </div>
          )}
          {isEditing && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setEditingId(null)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 13px", color:C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>CANCEL</button>
              <button onClick={saveEdit} style={{ background:`linear-gradient(135deg,${C.skyMid},${C.ocean})`, border:"none", borderRadius:8, padding:"5px 16px", color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>SAVE</button>
            </div>
          )}
        </div>

        {/* Hero card */}
        <Card style={{ marginBottom:14, background:`linear-gradient(135deg,${C.ocean}88,${C.deeper})` }}>
          {isEditing
            ? <input value={editName} onChange={e=>setEditName(e.target.value)} style={{ width:"100%", background:"transparent", border:`1px solid ${C.skyBlue}33`, borderRadius:8, color:C.sandLight, padding:"8px 12px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, outline:"none", marginBottom:10 }} />
            : <Num style={{ fontSize:20, color:C.sandLight, marginBottom:4 }}>{w.name}</Num>
          }
          <Body style={{ marginBottom:12 }}>{w.date}{w.duration!=="—" ? ` · ${w.duration}` : ""}</Body>
          {isSaved && (w.exercises||[]).length > 0 && (
            <div style={{ display:"flex", gap:16, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
              <div><Body style={{ fontSize:10 }}>Volume</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{volDisplay(w.exercises)}</Num></div>
              <div><Body style={{ fontSize:10 }}>Exercises</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{w.exercises.length}</Num></div>
              <div><Body style={{ fontSize:10 }}>Total Sets</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{w.exercises.reduce((a,ex)=>a+ex.sets.length,0)}</Num></div>
            </div>
          )}
          {!isSaved && w.kcal && (
            <Body style={{ color:"#f59e0b", fontSize:13, paddingTop:10, borderTop:`1px solid ${C.border}` }}>{w.kcal} kcal burned</Body>
          )}
        </Card>

        {/* Editable exercises */}
        {isEditing && (
          <ExerciseLogger exercises={editExercises} setExercises={setEditExercises} unit={unit} activeExIdx={editActiveEx} setActiveExIdx={setEditActiveEx} />
        )}

        {/* Read-only breakdown */}
        {!isEditing && isSaved && (w.exercises||[]).length > 0 && (
          <div>
            <Lbl>Exercise Breakdown</Lbl>
            {w.exercises.map((ex,ei) => (
              <Card key={ei} style={{ padding:"12px 14px" }}>
                <Num style={{ fontSize:14, color:C.sandLight, marginBottom:8 }}>{ex.name}</Num>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {ex.sets.map((s,si) => {
                    const dispW = w.unit==="lbs" ? s.weight : (unit==="lbs" ? kgToLbs(s.weight) : s.weight);
                    const dispU = w.unit==="lbs" ? "lbs" : unit;
                    return (
                      <div key={si} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:`${C.deeper}88`, borderRadius:8 }}>
                        <Body style={{ fontSize:11, color:C.sandDark, width:40 }}>Set {si+1}</Body>
                        <Body style={{ fontSize:13 }}>{s.reps} reps</Body>
                        <Body style={{ fontSize:13, color:C.skyBlue }}>{dispW} {dispU}</Body>
                        <Body style={{ fontSize:11, color:"#34d399" }}>✓</Body>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isEditing && !isSaved && (
          <Card style={{ textAlign:"center", padding:20 }}>
            <Body>This workout was recorded automatically by Apple Watch. Detailed exercise breakdown is not available for cardio sessions.</Body>
          </Card>
        )}
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[["history","History"],["log","Log Session"],["health","From Health"]].map(([id,label]) => (
          <button key={id} onClick={()=>setView(id)} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`1px solid ${C.skyBlue}33`, cursor:"pointer", background: view===id ? `${C.skyBlue}22` : "transparent", color: view===id ? C.skyBlue : C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:1.5 }}>{label}</button>
        ))}
      </div>

      {/* ── HISTORY ── */}
      {view === "history" && (
        <div>
          {saved.length === 0
            ? <Card style={{ textAlign:"center", padding:24 }}><Body>No manual workouts yet. Log your first session.</Body></Card>
            : saved.map((w,i) => (
              <Card key={w.id} style={{ cursor:"pointer" }} onClick={()=>setSelected({ src:"manual", id:w.id })}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <Num style={{ fontSize:15, color:C.sandLight }}>{w.name}</Num>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:5 }}>
                      <span style={{ background:`${C.skyBlue}22`, color:C.skyBlue, padding:"2px 8px", borderRadius:4, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:1.5 }}>Manual</span>
                      <Body style={{ fontSize:11 }}>{w.date}</Body>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <Body style={{ fontSize:11, color:C.skyBlue }}>{volDisplay(w.exercises)}</Body>
                    <Body style={{ fontSize:11, marginTop:2 }}>{w.exercises.length} exercises</Body>
                  </div>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── LOG SESSION ── */}
      {view === "log" && (
        <div>
          <Card style={{ padding:"12px 14px", marginBottom:10 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="Session name — e.g. Push Day"
                style={{ flex:1, background:"transparent", border:"none", color:C.sandLight, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, outline:"none" }} />
              <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${C.skyBlue}33`, flexShrink:0 }}>
                {["kg","lbs"].map(u => (
                  <button key={u} onClick={()=>setUnit(u)} style={{ padding:"6px 12px", border:"none", background: unit===u ? C.skyBlue : "transparent", color: unit===u ? C.deep : C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:1.5, cursor:"pointer", transition:"all 0.15s" }}>{u}</button>
                ))}
              </div>
            </div>
            {exercises.length > 0 && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}`, display:"flex", gap:16 }}>
                <div><Body style={{ fontSize:10 }}>Volume</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{volDisplay(exercises)}</Num></div>
                <div><Body style={{ fontSize:10 }}>Sets done</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{exercises.reduce((a,ex)=>a+ex.sets.filter(s=>s.done).length,0)}</Num></div>
                <div><Body style={{ fontSize:10 }}>Exercises</Body><Num style={{ fontSize:15, color:C.skyBlue }}>{exercises.length}</Num></div>
              </div>
            )}
          </Card>

          <ExerciseLogger exercises={exercises} setExercises={setExercises} unit={unit} activeExIdx={activeExIdx} setActiveExIdx={setActiveExIdx} />

          {exercises.length > 0 && (
            <button onClick={saveWorkout} style={{ width:"100%", padding:13, borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.skyMid},${C.ocean})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:11, letterSpacing:3, cursor:"pointer", marginTop:4 }}>
              FINISH &amp; SAVE
            </button>
          )}
        </div>
      )}

      {/* ── FROM HEALTH ── */}
      {view === "health" && (
        <div>
          <Card style={{ padding:"14px 16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#34d399" }} />
              <Body style={{ fontSize:11, letterSpacing:1 }}>Apple Health · Connected</Body>
            </div>
            <Body style={{ lineHeight:1.8 }}>Cardio workouts recorded by your Apple Watch appear here automatically. In the native app, this uses HealthKit's workout API.</Body>
          </Card>
          {HEALTH_WORKOUTS.map(w => (
            <Card key={w.id} style={{ cursor:"pointer" }} onClick={()=>setSelected({ src:"health", id:w.id })}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div>
                  <Num style={{ fontSize:15, color:C.sandLight }}>{w.name}</Num>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:5 }}>
                    <span style={{ background:`${C.skyBlue}22`, color:C.skyBlue, padding:"2px 8px", borderRadius:4, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:1.5 }}>Apple Watch</span>
                    <Body style={{ fontSize:11 }}>{w.date}</Body>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <Body>{w.duration}</Body>
                  <Body style={{ fontSize:11, color:"#f59e0b", marginTop:2 }}>{w.kcal} kcal</Body>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── NUTRITION ─── */
function NutritionTab({ loggedFoods, setLoggedFoods, macroTotals }) {
  const [view, setView]     = useState("log");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [grams, setGrams]   = useState("100");
  const [barcode, setBarcode] = useState("");
  const [barcodeResult, setBarcodeResult] = useState(null);

  function doSearch(q) {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    const r = SEED_FOODS.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
    setResults(r);
  }

  function addFood(food, g) {
    const gr = parseFloat(g) || 100;
    setLoggedFoods(prev => [...prev, { ...food, grams:gr }]);
    setSelected(null); setSearch(""); setResults([]); setGrams("100");
    setBarcodeResult(null); setBarcode("");
    setView("log");
  }

  function scanBarcode() {
    const found = BARCODE_DB[barcode.trim()];
    if (found) setBarcodeResult(found);
    else setBarcodeResult({ name:"Not found", per100:null });
  }

  const macroEntries = [
    { key:"protein",  label:"Protein",  color:C.skyBlue },
    { key:"carbs",    label:"Carbs",    color:C.sand    },
    { key:"fats",     label:"Fats",     color:C.rust    },
    { key:"calories", label:"Calories", color:C.skyMid  },
  ];

  return (
    <div>
      {/* Ring summary */}
      <Card style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
          <svg viewBox="0 0 72 72" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke={`${C.skyBlue}22`} strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke={C.skyBlue} strokeWidth="6"
              strokeDasharray={`${Math.min(100,(macroTotals.calories/macrosGoal.calories)*100)*1.885} 188.5`}
              strokeLinecap="round" />
          </svg>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
            <Num style={{ fontSize:13, color:C.sandLight }}>{Math.round(macroTotals.calories)}</Num>
            <Body style={{ fontSize:8, letterSpacing:0.5 }}>kcal</Body>
          </div>
        </div>
        <div style={{ flex:1 }}>
          {macroEntries.slice(0,3).map(m => (
            <div key={m.key} style={{ marginBottom:7 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <Body style={{ fontSize:10, letterSpacing:1 }}>{m.label}</Body>
                <Body style={{ fontSize:10 }}>{Math.round(macroTotals[m.key])} / {macrosGoal[m.key]}g</Body>
              </div>
              <div style={{ height:3, background:`${m.color}22`, borderRadius:2 }}>
                <div style={{ height:"100%", width:`${Math.min(100,(macroTotals[m.key]/macrosGoal[m.key])*100)}%`, background:m.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[["log","Today's Log"],["search","Search Food"],["barcode","Barcode"]].map(([id,label]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`1px solid ${C.skyBlue}33`, cursor:"pointer", background: view===id ? `${C.skyBlue}22` : "transparent", color: view===id ? C.skyBlue : C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:1.2 }}>{label}</button>
        ))}
      </div>

      {/* LOG VIEW */}
      {view === "log" && (
        <div>
          {loggedFoods.map((f,i) => {
            const r = f.grams / 100;
            return (
              <Card key={i} style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <Num style={{ fontSize:13, color:C.sandLight }}>{f.name}</Num>
                    <Body style={{ fontSize:11, marginTop:3 }}>{f.grams}g · {Math.round(f.per100.calories * r)} kcal</Body>
                  </div>
                  <button onClick={() => setLoggedFoods(prev => prev.filter((_,j) => j!==i))} style={{ background:"none", border:"none", color:C.rust, cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 0 0 8px" }}>×</button>
                </div>
                <div style={{ display:"flex", gap:12, marginTop:8 }}>
                  {[["P",f.per100.protein,C.skyBlue],["C",f.per100.carbs,C.sand],["F",f.per100.fats,C.rust]].map(([l,v,c]) => (
                    <Body key={l} style={{ fontSize:11, color:c }}>{l}: {Math.round(v*r)}g</Body>
                  ))}
                </div>
              </Card>
            );
          })}
          <button onClick={() => setView("search")} style={{ width:"100%", padding:"12px", borderRadius:12, border:`1px dashed ${C.skyBlue}44`, background:"transparent", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer" }}>+ ADD FOOD</button>
        </div>
      )}

      {/* SEARCH VIEW */}
      {view === "search" && (
        <div>
          <input
            value={search}
            onChange={e => doSearch(e.target.value)}
            placeholder="Search food — e.g. chicken breast"
            style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}33`, borderRadius:12, color:C.sand, padding:"12px 16px", fontSize:15, fontFamily:"'Cormorant Garamond',serif", outline:"none", marginBottom:12, display:"block" }}
          />
          {selected ? (
            <Card>
              <Lbl>Add to Log</Lbl>
              <Num style={{ fontSize:16, color:C.sandLight, marginBottom:4 }}>{selected.name}</Num>
              <Body style={{ marginBottom:14 }}>Per 100g: {selected.per100.calories} kcal · P {selected.per100.protein}g · C {selected.per100.carbs}g · F {selected.per100.fats}g</Body>
              <Body style={{ fontSize:10, marginBottom:6 }}>Quantity (grams)</Body>
              <input value={grams} onChange={e => setGrams(e.target.value)} type="number"
                style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}22`, borderRadius:9, color:C.sand, padding:"10px 13px", fontSize:16, fontFamily:"'Josefin Sans',sans-serif", outline:"none", marginBottom:12 }} />
              {grams && (
                <div style={{ padding:10, background:`${C.deeper}88`, borderRadius:10, marginBottom:12 }}>
                  <Body style={{ fontSize:12 }}>
                    {grams}g → {Math.round(selected.per100.calories * grams/100)} kcal ·
                    P {Math.round(selected.per100.protein * grams/100)}g ·
                    C {Math.round(selected.per100.carbs * grams/100)}g ·
                    F {Math.round(selected.per100.fats * grams/100)}g
                  </Body>
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setSelected(null)} style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${C.skyBlue}33`, background:"transparent", color:C.sandDark, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer" }}>BACK</button>
                <button onClick={() => addFood(selected, grams)} style={{ flex:2, padding:11, borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.ocean},${C.skyMid})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer" }}>ADD TO LOG</button>
              </div>
            </Card>
          ) : results.map(f => (
            <Card key={f.id} style={{ cursor:"pointer", padding:"12px 14px" }} onClick={() => setSelected(f)}>
              <Num style={{ fontSize:14, color:C.sandLight }}>{f.name}</Num>
              <Body style={{ fontSize:12, marginTop:3 }}>Per 100g: {f.per100.calories} kcal · P {f.per100.protein}g · C {f.per100.carbs}g · F {f.per100.fats}g</Body>
            </Card>
          ))}
        </div>
      )}

      {/* BARCODE VIEW */}
      {view === "barcode" && (
        <div>
          <Card style={{ textAlign:"center", padding:"20px 16px", marginBottom:12 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⬛</div>
            <Lbl>Barcode Scanner</Lbl>
            <Body style={{ lineHeight:1.7 }}>In the native app, this opens your camera. For now, enter the barcode number to test the lookup.</Body>
          </Card>
          <Card>
            <Body style={{ fontSize:10, marginBottom:6 }}>Enter Barcode Number</Body>
            <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="e.g. 8901058851427"
              style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}22`, borderRadius:9, color:C.sand, padding:"10px 13px", fontSize:14, fontFamily:"'Josefin Sans',sans-serif", outline:"none", marginBottom:10 }} />
            <button onClick={scanBarcode} style={{ width:"100%", padding:11, borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.ocean},${C.skyMid})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer" }}>LOOKUP</button>
            {barcodeResult && barcodeResult.per100 && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                <Num style={{ fontSize:15, color:C.sandLight, marginBottom:4 }}>{barcodeResult.name}</Num>
                <Body style={{ marginBottom:10 }}>Per 100g: {barcodeResult.per100.calories} kcal · P {barcodeResult.per100.protein}g · C {barcodeResult.per100.carbs}g · F {barcodeResult.per100.fats}g</Body>
                <input value={grams} onChange={e => setGrams(e.target.value)} type="number" placeholder="Grams"
                  style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}22`, borderRadius:9, color:C.sand, padding:"10px 13px", fontSize:14, fontFamily:"'Josefin Sans',sans-serif", outline:"none", marginBottom:10 }} />
                <button onClick={() => addFood(barcodeResult, grams)} style={{ width:"100%", padding:11, borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.ocean},${C.skyMid})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:10, letterSpacing:2, cursor:"pointer" }}>ADD TO LOG</button>
              </div>
            )}
            {barcodeResult && !barcodeResult.per100 && (
              <Body style={{ textAlign:"center", color:C.rust, marginTop:12 }}>Product not found in database.</Body>
            )}
            <Body style={{ fontSize:11, marginTop:12, textAlign:"center", color:C.sandDark }}>
              Try: 8901058851427 · 8901719110085 · 0016000275188
            </Body>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── PROFILE OVERLAY ─── */
function ProfileOverlay({ profile, setProfile, onClose }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...profile });

  const bmi = (draft.weight / ((draft.height/100) ** 2)).toFixed(1);
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = bmi < 18.5 ? C.skyBlue : bmi < 25 ? "#34d399" : bmi < 30 ? C.sand : C.rust;

  function save() { setProfile({ ...draft }); setEditing(false); }

  const statItems = [
    { label:"Age",    val:draft.age,    unit:"yrs",  icon:"◎" },
    { label:"Weight", val:draft.weight, unit:"kg",   icon:"◈" },
    { label:"Height", val:draft.height, unit:"cm",   icon:"△" },
    { label:"BMI",    val:bmi,          unit:bmiLabel,icon:"◑" },
  ];

  const fields = [
    { key:"name",   label:"Full Name",    type:"text"   },
    { key:"age",    label:"Age",          type:"number" },
    { key:"weight", label:"Weight (kg)",  type:"number" },
    { key:"height", label:"Height (cm)",  type:"number" },
    { key:"goal",   label:"Health Goal",  type:"text"   },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, maxWidth:420, margin:"0 auto", display:"flex", flexDirection:"column" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(4,15,26,0.7)", backdropFilter:"blur(6px)" }} />

      {/* Sheet */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:C.deep, borderRadius:"24px 24px 0 0", border:`1px solid ${C.skyBlue}22`, animation:"slideup 0.35s cubic-bezier(0.32,0.72,0,1)", maxHeight:"92vh", overflowY:"auto", paddingBottom:40 }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:`${C.skyBlue}33` }} />
        </div>

        {/* Avatar + name */}
        <div style={{ padding:"20px 24px 0", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${C.ocean},${C.rust})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:26, color:C.sandLight, border:`2px solid ${C.skyBlue}44`, flexShrink:0 }}>V</div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, letterSpacing:2, color:C.sandLight, textTransform:"uppercase" }}>{profile.name}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:C.sandDark, fontStyle:"italic", marginTop:2 }}>{profile.goal}</div>
          </div>
          <button onClick={() => setEditing(!editing)} style={{ marginLeft:"auto", background:`${C.skyBlue}18`, border:`1px solid ${C.skyBlue}44`, borderRadius:10, padding:"6px 14px", color:C.skyBlue, fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, cursor:"pointer" }}>
            {editing ? "CANCEL" : "EDIT"}
          </button>
        </div>

        {!editing ? (
          <div style={{ padding:"20px 24px 0" }}>
            {/* Stat grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              {statItems.map(s => (
                <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.8, marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:26, color: s.label === "BMI" ? bmiColor : C.sandLight, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, color: s.label === "BMI" ? bmiColor : C.sandDark, marginTop:3 }}>{s.unit}</div>
                </div>
              ))}
            </div>

            {/* Health tags */}
            <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.8, marginBottom:10 }}>Synced Sources</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
              {["Apple Watch · Sleep","Apple Watch · HRV","Apple Watch · Workouts","Manual · Nutrition"].map(t => (
                <div key={t} style={{ background:`${C.skyBlue}15`, border:`1px solid ${C.skyBlue}33`, borderRadius:20, padding:"5px 12px", fontFamily:"'Cormorant Garamond',serif", fontSize:12, color:C.skyBlue }}>
                  <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#34d399", marginRight:6, verticalAlign:"middle" }} />{t}
                </div>
              ))}
            </div>

            {/* Weekly summary */}
            <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.8, marginBottom:10 }}>This Week</div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
              {[
                { label:"Avg Sleep",    val:"6h 14m" },
                { label:"Workouts",     val:"4 sessions" },
                { label:"Avg Calories", val:"2,180 kcal" },
                { label:"Avg HRV",      val:"44 ms" },
              ].map((r,i,arr) => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", paddingBottom: i < arr.length-1 ? 10 : 0, marginBottom: i < arr.length-1 ? 10 : 0, borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:C.sandDark }}>{r.label}</div>
                  <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, fontSize:13, color:C.sandLight }}>{r.val}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding:"20px 24px 0" }}>
            <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:3, color:C.skyBlue, textTransform:"uppercase", opacity:0.8, marginBottom:14 }}>Edit Profile</div>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, color:C.sandDark, textTransform:"uppercase", marginBottom:6 }}>{f.label}</div>
                <input
                  type={f.type}
                  value={draft[f.key]}
                  onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width:"100%", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}33`, borderRadius:10, color:C.sandLight, padding:"11px 14px", fontFamily:"'Cormorant Garamond',serif", fontSize:15, outline:"none" }}
                />
              </div>
            ))}
            {/* Live BMI preview */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:C.sandDark, fontStyle:"italic" }}>Calculated BMI</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, color:bmiColor }}>{bmi} <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:400, fontSize:13 }}>{bmiLabel}</span></div>
            </div>
            <button onClick={save} style={{ width:"100%", padding:13, borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.skyMid},${C.ocean})`, color:C.sandLight, fontFamily:"'Josefin Sans',sans-serif", fontSize:11, letterSpacing:3, cursor:"pointer" }}>SAVE PROFILE</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ATLAS AI ─── */
const TOOL_LABELS = {
  get_sleep_data:          { icon:"◑", label:"Reading sleep data…"       },
  get_nutrition_data:      { icon:"◈", label:"Checking nutrition log…"   },
  search_food:             { icon:"⬡", label:"Searching food database…"  },
  get_workout_data:        { icon:"△", label:"Loading workout history…"  },
  calculate_recovery_score:{ icon:"♡", label:"Calculating recovery…"     },
};

function AITab({ chat, input, setInput, send, loading, thinking, chatEndRef }) {
  const SUGGESTIONS = ["How's my recovery today?", "Should I train or rest?", "Help me hit my protein goal", "What's my sleep been like this week?"];
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 196px)" }}>
      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, paddingBottom:12 }}>
        {chat.map((m, i) => {

          /* ── Tool call step (agent action) ── */
          if (m.role === "tool") {
            const meta = TOOL_LABELS[m.toolCall] || { icon:"⬡", label: m.text };
            return (
              <div key={i} style={{ animation:"fadein 0.2s ease", display:"flex", alignItems:"center", gap:8, paddingLeft:34 }}>
                <div style={{ width:18, height:18, borderRadius:4, background:`${C.skyBlue}22`, border:`1px solid ${C.skyBlue}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:C.skyBlue, flexShrink:0 }}>{meta.icon}</div>
                <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, color:`${C.skyBlue}99`, textTransform:"uppercase" }}>{meta.label}</span>
                <div style={{ flex:1, height:1, background:`${C.skyBlue}18` }} />
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:10, color:`${C.skyBlue}66`, fontStyle:"italic" }}>✓</span>
              </div>
            );
          }

          /* ── User / AI bubble ── */
          const isUser = m.role === "user";
          return (
            <div key={i} style={{ animation:"fadein 0.3s ease", display:"flex", flexDirection:"column", alignItems: isUser ? "flex-end" : "flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexDirection: isUser ? "row-reverse" : "row" }}>
                {!isUser
                  ? <div style={{ width:26, height:26, borderRadius:8, background:C.deeper, border:`1.5px solid ${C.skyBlue}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:7, color:C.skyBlue, letterSpacing:1, flexShrink:0 }}>ATLAS</div>
                  : <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${C.ocean},${C.rust})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:10, color:C.sandLight, flexShrink:0 }}>V</div>
                }
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, letterSpacing:2, color: isUser ? C.sandDark : C.skyBlue }}>{isUser ? "VIKHYAATH" : "ATLAS"}</span>
                  {m.ts && <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, color:C.sandDark, fontStyle:"italic" }}>{m.ts}</span>}
                </div>
              </div>
              <div style={{
                maxWidth:"86%",
                marginLeft: !isUser ? 34 : 0,
                marginRight: isUser ? 34 : 0,
                background: isUser ? `linear-gradient(145deg,${C.rust}cc,${C.rust}99)` : `${C.ocean}77`,
                border:`1px solid ${isUser ? C.rust+"55" : C.skyBlue+"1a"}`,
                borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                padding:"13px 16px",
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:16, lineHeight:1.7, color: isUser ? C.sandLight : C.sand, letterSpacing:0.3,
              }}>{m.text}</div>
            </div>
          );
        })}

        {/* Thinking pulse */}
        {(thinking || loading) && (
          <div style={{ animation:"fadein 0.2s ease", display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <div style={{ width:26, height:26, borderRadius:8, background:C.deeper, border:`1.5px solid ${C.skyBlue}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:7, color:C.skyBlue, letterSpacing:1, flexShrink:0 }}>ATLAS</div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, color:C.sandDark, fontStyle:"italic", animation:"shimmer 1.4s infinite" }}>{thinking ? "thinking…" : "using tools…"}</span>
            </div>
            <div style={{ marginLeft:34, background:`${C.ocean}77`, border:`1px solid ${C.skyBlue}1a`, borderRadius:"4px 18px 18px 18px", padding:"14px 20px", display:"flex", alignItems:"center", gap:6 }}>
              {[0,1,2].map(k => <div key={k} style={{ width:7, height:7, borderRadius:"50%", background:C.skyBlue, animation:`arqpulse 1.1s ${k*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {!thinking && !loading && chat.length <= 4 && (
        <div style={{ display:"flex", gap:7, marginBottom:10, flexWrap:"wrap" }}>
          {SUGGESTIONS.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ padding:"6px 12px", background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}33`, borderRadius:20, color:C.skyBlue, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:12, cursor:"pointer" }}>{q}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ paddingTop:10, borderTop:`1px solid ${C.skyBlue}18` }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ flex:1, background:`${C.ocean}55`, border:`1px solid ${C.skyBlue}33`, borderRadius:16, padding:"11px 16px", display:"flex", alignItems:"center" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask ATLAS — it will read your data…"
              style={{ flex:1, background:"none", border:"none", color:C.sand, fontFamily:"'Cormorant Garamond',serif", fontSize:15, outline:"none" }}
            />
          </div>
          <button onClick={send} disabled={loading || thinking || !input.trim()} style={{
            width:44, height:44, borderRadius:13, border:`1px solid ${C.skyBlue}33`, flexShrink:0,
            background: (!loading && !thinking && input.trim()) ? `linear-gradient(135deg,${C.skyMid},${C.ocean})` : `${C.ocean}55`,
            color: (!loading && !thinking && input.trim()) ? C.sandLight : C.sandDark,
            cursor: (!loading && !thinking && input.trim()) ? "pointer" : "default",
            fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s",
          }}>↑</button>
        </div>
        <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:9, letterSpacing:2, color:`${C.sandDark}88`, textAlign:"center", marginTop:7, textTransform:"uppercase" }}>
          Agent · 5 tools · Live health data
        </div>
      </div>
    </div>
  );
}

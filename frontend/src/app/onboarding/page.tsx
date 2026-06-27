"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Target, Brain, BookOpen, Search, Zap,
  CheckCircle2, Loader2, ArrowRight, Calendar, Clock, BarChart2,
} from "lucide-react";

const AGENTS = [
  {
    id: "planner",
    name: "Planner Agent",
    role: "Building your personalized roadmap & milestones...",
    icon: Target,
    color: "text-primary",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    glow: "shadow-indigo-500/20",
  },
  {
    id: "tutor",
    name: "Tutor Agent",
    role: "Generating lesson notes & learning summaries...",
    icon: Brain,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/20",
  },
  {
    id: "quiz",
    name: "Quiz Agent",
    role: "Preparing assessments & knowledge checkpoints...",
    icon: BookOpen,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  {
    id: "research",
    name: "Research Agent",
    role: "Discovering resources, certifications & career path...",
    icon: Search,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
];

type Phase = "form" | "generating" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [activeAgentIdx, setActiveAgentIdx] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Form state
  const getDefaultDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split("T")[0];
  };
  const [goal, setGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [studyTime, setStudyTime] = useState("60");
  const [targetDate, setTargetDate] = useState(getDefaultDate);

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/register");
  }, [router]);

  // Once all agents complete, wait a beat then navigate
  useEffect(() => {
    if (completedAgents.length === AGENTS.length) {
      setPhase("complete");
      const timer = setTimeout(() => router.push("/dashboard"), 2000);
      return () => clearTimeout(timer);
    }
  }, [completedAgents, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/register");
      return;
    }

    setPhase("generating");
    setActiveAgentIdx(0);
    setCompletedAgents([]);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Step 1: Planner Agent
      const plannerRes = await fetch(`${API_BASE}/api/roadmap/step/planner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal,
          skill_level: skillLevel,
          daily_study_time: parseInt(studyTime),
          target_date: targetDate,
        }),
      });

      if (!plannerRes.ok) {
        const data = await plannerRes.json().catch(() => ({}));
        throw new Error(data.detail || "Planner Agent failed to generate roadmap.");
      }

      const roadmap = await plannerRes.json();
      const roadmapId = roadmap.id;

      // Update state for completed planner agent
      setCompletedAgents(["planner"]);
      setActiveAgentIdx(1);

      // Step 2: Tutor Agent
      const tutorRes = await fetch(`${API_BASE}/api/roadmap/step/tutor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roadmap_id: roadmapId }),
      });

      if (!tutorRes.ok) {
        const data = await tutorRes.json().catch(() => ({}));
        throw new Error(data.detail || "Tutor Agent failed to generate study notes.");
      }

      setCompletedAgents(["planner", "tutor"]);
      setActiveAgentIdx(2);

      // Step 3: Quiz Agent
      const quizRes = await fetch(`${API_BASE}/api/roadmap/step/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roadmap_id: roadmapId }),
      });

      if (!quizRes.ok) {
        const data = await quizRes.json().catch(() => ({}));
        throw new Error(data.detail || "Quiz Agent failed to generate quiz questions.");
      }

      setCompletedAgents(["planner", "tutor", "quiz"]);
      setActiveAgentIdx(3);

      // Step 4: Research Agent
      const researchRes = await fetch(`${API_BASE}/api/roadmap/step/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roadmap_id: roadmapId }),
      });

      if (!researchRes.ok) {
        const data = await researchRes.json().catch(() => ({}));
        throw new Error(data.detail || "Research Agent failed to discover resources.");
      }

      setCompletedAgents(["planner", "tutor", "quiz", "research"]);
      setActiveAgentIdx(-1);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Something went wrong.");
      setPhase("form");
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] rounded-full bg-primary text-primary-foreground/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {/* ===== FORM PHASE ===== */}
          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-3">
                  Define Your Learning Goal
                </h1>
                <p className="text-text-muted text-sm leading-relaxed max-w-md mx-auto">
                  Enter your goal once. Four AI agents will immediately collaborate to build your complete personalized learning ecosystem.
                </p>
              </div>

              {/* Agent preview strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {AGENTS.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <div key={agent.id} className={`glass-panel ${agent.border} border rounded-xl p-3 flex flex-col items-center gap-2 text-center`}>
                      <div className={`${agent.bg} p-2 rounded-lg`}>
                        <Icon className={`w-4 h-4 ${agent.color}`} />
                      </div>
                      <span className={`text-xs font-bold ${agent.color}`}>{agent.name}</span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl mb-6">
                  {error}
                </div>
              )}

              {/* Form card */}
              <div className="glass-panel rounded-2xl border border-border shadow-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Goal */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      What do you want to learn?
                    </label>
                    <input
                      type="text"
                      required
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Become an AI Engineer, Master Python, Learn Web Development..."
                      className="w-full bg-card border border-border rounded-xl py-4 px-5 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition text-sm"
                    />
                  </div>

                  {/* Parameters grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Skill Level */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        <BarChart2 className="w-3.5 h-3.5" />
                        Skill Level
                      </label>
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-indigo-500/80 transition text-sm"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Daily Study Time */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        Daily Study
                      </label>
                      <select
                        value={studyTime}
                        onChange={(e) => setStudyTime(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-indigo-500/80 transition text-sm"
                      >
                        <option value="30">30 Min</option>
                        <option value="60">1 Hour</option>
                        <option value="90">1.5 Hours</option>
                        <option value="120">2 Hours</option>
                        <option value="180">3 Hours</option>
                      </select>
                    </div>

                    {/* Target Date */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        Target Date
                      </label>
                      <input
                        type="date"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-indigo-500/80 transition text-sm [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!goal.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-text font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 text-base mt-2"
                  >
                    <Zap className="w-5 h-5" />
                    Generate My Learning Journey
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-center text-xs text-text-muted">
                    All 4 AI agents activate simultaneously upon submission
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {/* ===== GENERATING PHASE ===== */}
          {(phase === "generating" || phase === "complete") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              {/* Central pulsing icon */}
              <div className="relative mx-auto w-24 h-24 mb-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary text-primary-foreground/20 animate-ping" />
                <div className="absolute inset-3 rounded-full bg-primary text-primary-foreground/30 animate-ping" style={{ animationDelay: "0.3s" }} />
                <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl shadow-primary/40">
                  {phase === "complete" ? (
                    <CheckCircle2 className="w-8 h-8 text-text" />
                  ) : (
                    <GraduationCap className="w-8 h-8 text-text animate-pulse" />
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                {phase === "complete" ? "Learning Ecosystem Ready!" : "Activating Your AI Team"}
              </h2>
              <p className="text-text-muted text-sm mb-10">
                {phase === "complete"
                  ? "Redirecting to your Command Center..."
                  : `Building personalized learning package for: "${goal}"`}
              </p>

              {/* Agent cards */}
              <div className="space-y-3 max-w-lg mx-auto">
                {AGENTS.map((agent, idx) => {
                  const Icon = agent.icon;
                  const isCompleted = completedAgents.includes(agent.id);
                  const isActive = activeAgentIdx === idx && !isCompleted;
                  const isPending = !isCompleted && !isActive;

                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`glass-panel rounded-xl border px-5 py-4 flex items-center gap-4 transition-all duration-500 ${
                        isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : isActive
                          ? `${agent.border} shadow-lg ${agent.glow}`
                          : "border-border opacity-40"
                      }`}
                    >
                      <div className={`${isCompleted ? "bg-emerald-500/10" : agent.bg} p-2.5 rounded-lg flex-shrink-0`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : isActive ? (
                          <Icon className={`w-5 h-5 ${agent.color} animate-pulse`} />
                        ) : (
                          <Icon className={`w-5 h-5 ${agent.color}`} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-bold text-sm ${isCompleted ? "text-emerald-300" : isActive ? agent.color : "text-text-muted"}`}>
                          {agent.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${isCompleted ? "text-emerald-400/70" : isActive ? "text-text-muted" : "text-slate-600"}`}>
                          {isCompleted ? "✓ Complete" : isActive ? agent.role : "Waiting..."}
                        </p>
                      </div>
                      {isActive && (
                        <Loader2 className={`w-4 h-4 ${agent.color} animate-spin flex-shrink-0`} />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-8 max-w-lg mx-auto">
                <div className="flex justify-between text-xs text-text-muted mb-2">
                  <span>Building learning package...</span>
                  <span>{Math.round((completedAgents.length / AGENTS.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                    animate={{ width: `${(completedAgents.length / AGENTS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

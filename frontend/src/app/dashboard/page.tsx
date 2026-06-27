"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  GraduationCap, Award, Flame, Hourglass, Trophy, Sparkles,
  BookOpen, Compass, ArrowRight, Target, Brain, Search,
  CheckCircle2, BarChart2, Briefcase, AlertTriangle, Star,
  Zap, ChevronRight, TrendingUp, FileText, Video, ExternalLink,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadialBarChart, RadialBar,
} from "recharts";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } },
};

function SectionLabel({ icon: Icon, label, color = "text-text-muted" }: { icon: any; label: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatMarkdownToHTML = (markdown: string) => {
    if (!markdown) return "<p>No study notes available.</p>";
    let html = markdown;

    // Simple HTML escaping
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="color:#4f46e5;font-size:1.1rem;margin-top:1.2rem;margin-bottom:0.4rem;font-family:Outfit,sans-serif;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color:#4f46e5;font-size:1.3rem;margin-top:1.6rem;margin-bottom:0.6rem;font-family:Outfit,sans-serif;border-bottom:1px solid #e2e8f0;padding-bottom:0.2rem;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="color:#312e81;font-size:1.75rem;margin-top:2rem;margin-bottom:0.8rem;font-family:Outfit,sans-serif;">$1</h1>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s*(.*$)/gim, '<li style="margin-left:1.2rem;margin-bottom:0.4rem;color:#334155;font-size:0.9rem;">$1</li>');

    // Paragraph paragraphs
    html = html.split('\n').map(line => {
      if (line.trim().startsWith('<h') || line.trim().startsWith('<li') || !line.trim()) return line;
      return `<p style="margin-bottom:0.8rem;line-height:1.6;color:#334155;font-size:0.9rem;">${line}</p>`;
    }).join('\n');

    return html;
  };

  const handleDownloadPDF = () => {
    const notesContent = studyNotes || `
# Study Notes: ${formattedGoal}
## Introduction
Welcome to your personalized learning notes for ${formattedGoal}.

## Core Concepts
- **Adaptive Roadmap**: Your milestones adjust dynamically based on your progress.
- **AI Tutor Console**: Reach out for interactive concepts review.
- **Weekly Checkpoints**: Take quizzes to verify understanding.
    `;
    const formattedHTML = formatMarkdownToHTML(notesContent);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Study Notes - ${formattedGoal}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              line-height: 1.6;
              padding: 2.5rem;
              max-width: 800px;
              margin: 0 auto;
            }
            h1, h2, h3 {
              font-family: 'Outfit', sans-serif;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 1.5rem;
              margin-bottom: 2rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-weight: 700;
              font-size: 1.25rem;
              color: #4f46e5;
            }
            .meta {
              font-size: 0.75rem;
              color: #64748b;
            }
            .footer {
              border-top: 1px solid #e2e8f0;
              margin-top: 3rem;
              padding-top: 1rem;
              font-size: 0.75rem;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">EduVerse AI Study Companion</div>
            <div class="meta">Goal: ${formattedGoal} | Date: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="content">
            ${formattedHTML}
          </div>
          
          <div class="footer">
            Generated dynamically by EduVerse AI. Keep learning!
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const fetchSummaryAndRoadmap = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      try {
        const [summaryRes, roadmapRes] = await Promise.all([
          fetch("/api/analytics/summary", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/roadmap/active", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (roadmapRes.status === 404) {
          router.push("/onboarding");
          return;
        }

        if (!summaryRes.ok || !roadmapRes.ok) throw new Error("Auth expired");

        const summary = await summaryRes.json();
        const roadmap = await roadmapRes.json();
        setData(summary);
        setRoadmapData(roadmap);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchSummaryAndRoadmap();
  }, [router]);



  const defaultActivity = [
    { day: "Mon", hours: 1.5 }, { day: "Tue", hours: 2.2 },
    { day: "Wed", hours: 1.8 }, { day: "Thu", hours: 3.5 },
    { day: "Fri", hours: 2.7 }, { day: "Sat", hours: 4.2 },
    { day: "Sun", hours: 3.0 },
  ];
  const chartData = data?.activity_chart?.length ? data.activity_chart : defaultActivity;

  const progress = data?.progress ?? 0;
  const streak = data?.streak ?? 1;
  const quizAvg = data?.quiz_average ?? 0;
  const studyHours = data?.study_hours ?? 0;
  const goal = data?.goal ?? "General Learning";
  const level = data?.current_level ?? "Beginner";
  const careerReadiness = data?.career_readiness ?? 0;

  // Clean goal for dynamic fallbacks
  const cleanGoal = goal.replace(/^(learn|learning|become a|become an|mastering|master)\s+/i, "");
  const formattedGoal = cleanGoal ? (cleanGoal.charAt(0).toUpperCase() + cleanGoal.slice(1)) : "Learning Topic";

  const missingSkills: string[] = data?.missing_skills?.length ? data.missing_skills : [`Core ${formattedGoal} Fundamentals`, `${formattedGoal} Advanced Concepts`, "API Integration & MLOps"];
  const targetRoles: string[] = data?.target_roles?.length ? data.target_roles : [`Junior ${formattedGoal} Engineer`, `Senior ${formattedGoal} Specialist`].slice(0, 3);
  const certifications: string[] = data?.certifications?.length ? data.certifications : [`${formattedGoal} Professional Certificate`, `Google Cloud ${formattedGoal} Specialist`].slice(0, 3);

  // Study notes for current lesson from analytics
  const studyNotes = data?.current_lesson_notes ?? null;

  // Quizzes ready
  const quizzesReady = data?.quizzes_ready ?? 0;

  // Resources
  const resources = data?.resources?.length ? data.resources : [
    { title: `Introduction to ${formattedGoal}`, type: "video", source: "YouTube", url: "https://youtube.com" },
    { title: `${formattedGoal} Official Reference Guide`, type: "article", source: "Documentation", url: "https://google.com" },
    { title: `Mastering ${formattedGoal} Video Tutorial`, type: "video", source: "YouTube", url: "https://youtube.com" },
  ];

  // Extract all lessons and build dynamic lists
  const allLessons = roadmapData?.milestones?.flatMap((m: any) => m.lessons) || [];

  // Mapped Milestones
  const dbMilestones = roadmapData?.milestones || [];
  const mappedMilestones = dbMilestones.map((m: any, idx: number) => {
    const allCompleted = m.lessons.every((l: any) => l.status === "Completed");
    const anyCurrent = m.lessons.some((l: any) => l.status === "Current");
    const status = allCompleted ? "completed" : (anyCurrent ? "current" : "upcoming");
    return {
      title: m.title,
      status,
      week: `Phase ${idx + 1}`
    };
  });

  // Mapped Quizzes (Assessments)
  const dbQuizzes = allLessons
    .filter((l: any) => l.quiz_questions && l.quiz_questions !== "[]" && l.quiz_questions !== "null")
    .map((l: any) => {
      let qCount = 5;
      try {
        const qList = typeof l.quiz_questions === "string" ? JSON.parse(l.quiz_questions) : l.quiz_questions;
        if (Array.isArray(qList)) qCount = qList.length;
      } catch { }
      return {
        title: `${l.title} Quiz`,
        type: "Concept Review",
        questions: qCount,
        status: l.status === "Completed" ? "completed" : "ready"
      };
    });

  const quizzes = dbQuizzes.length ? dbQuizzes.slice(0, 3) : [
    { title: `${formattedGoal} Basics Quiz`, type: "MCQ", questions: 10, status: "ready" },
    { title: `${formattedGoal} Intermediate Concepts`, type: "MCQ", questions: 8, status: "ready" },
    { title: `${formattedGoal} Overview`, type: "True/False", questions: 5, status: "completed" },
  ];

  // Recommended actions
  const currentLesson = allLessons.find((l: any) => l.status === "Current");
  const continueDesc = currentLesson
    ? `${currentLesson.title} — ${currentLesson.estimated_time} mins remaining`
    : `Start your first lesson on ${formattedGoal}`;

  const radialData = [{ value: careerReadiness, fill: "#6366f1" }];

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-10 space-y-10 custom-scroll">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary text-primary-foreground/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 p-4 rounded-2xl shadow-2xl">
                <GraduationCap className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <span className="text-text-muted font-medium text-sm tracking-wider">
              Synchronizing AI Command Center...
            </span>
          </div>
        ) : (
          <>
        {/* ─── SECTION 1: Current Goal ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-text-muted font-semibold tracking-widest uppercase">
                AI Learning Command Center — System Operational
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">
              Explorer Workspace
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-semibold">{goal}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-violet-300 font-semibold">{level}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-text-muted uppercase tracking-wider">Overall Progress</p>
              <h2 className="text-4xl font-black text-text">{roadmapData?.progress || 0}%</h2>
            </div>
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-progress-track" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${progress} ${100 - progress}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text tabular-nums">{progress}%</span>
            </div>
          </div>
        </motion.div>

        {/* ─── SECTION 2: Learning Progress Stats ─────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Study Streak", value: `${streak}d`, icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "consecutive days" },
            { label: "Quiz Average", value: `${quizAvg}%`, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "score accuracy" },
            { label: "Study Hours", value: `${studyHours}h`, icon: Hourglass, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", desc: "total logged" },
            { label: "Assessments", value: `${quizzesReady}`, icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", desc: "ready to take" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="bg-card/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 hover:scale-[1.02] transition-all flex items-center gap-5"
              >
                <div className={`${stat.bg} border ${stat.border} p-3 rounded-xl flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-text leading-tight">{stat.value}</p>
                  <p className="text-[10px] text-text-muted">{stat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── SECTIONS 3 & 4: Active Roadmap + Study Notes Ready ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Active Roadmap — col-span-3 */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 lg:col-span-3 space-y-6">
            <SectionLabel icon={Compass} label="Active Roadmap" color="text-primary" />
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>Roadmap Completion</span>
                <span className="text-text font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-progress-track rounded-full overflow-hidden mb-5">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
            {/* Current & Next milestones */}
            <div className="space-y-3">
              {(mappedMilestones.length ? mappedMilestones : [{ title: `${formattedGoal} Introduction`, status: "current", week: "Phase 1" }]).map((item: any) => (
                <div key={item.title} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.status === "current"
                    ? "bg-indigo-650/10 border-indigo-500/30"
                    : item.status === "completed"
                      ? "bg-emerald-500/5 border-emerald-500/15 opacity-70"
                      : "bg-card border-border opacity-50"
                  }`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === "current" ? "bg-indigo-500 animate-pulse" :
                      item.status === "completed" ? "bg-emerald-500" : "bg-slate-600"
                    }`} />
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${item.status === "current" ? "text-text" :
                        item.status === "completed" ? "text-text-muted line-through" : "text-text-muted"
                      }`}>{item.title}</span>
                    <span className="text-[10px] text-text-muted ml-2">{item.week}</span>
                  </div>
                  {item.status === "current" && (
                    <Link href="/roadmap" className="flex items-center gap-1 text-xs text-primary font-bold hover:text-primary transition">
                      Continue <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {item.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
            <Link href="/roadmap" className="flex items-center justify-center gap-2 text-xs text-text-muted hover:text-primary transition font-semibold mt-2 pt-2 border-t border-border">
              View Full Roadmap <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Study Notes Ready — col-span-2 */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 lg:col-span-2 flex flex-col">
            <SectionLabel icon={Brain} label="Study Notes Ready" color="text-violet-400" />
            <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto max-h-56 custom-scroll mb-4 shadow-inner">
              {studyNotes ? (
                <div className="text-sm text-text leading-relaxed whitespace-pre-wrap font-medium">
                  {studyNotes}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { title: `${formattedGoal} Basics`, desc: `Understanding the core concepts and definitions of ${formattedGoal}.` },
                    { title: "Key Terminology", desc: `Standard keywords, concepts, and structures in ${formattedGoal}.` },
                    { title: "Practical Application", desc: `Exercises and scenarios to practice your skills in ${formattedGoal}.` },
                    { title: "Reference Materials", desc: `Curated reference guides and documentation for learning ${formattedGoal}.` },
                  ].map((note, i) => (
                    <div key={i} className="flex flex-col border-l-2 border-indigo-500 pl-3 py-1">
                      <span className="text-sm font-bold text-primary">{note.title}</span>
                      <span className="text-xs text-text-muted mt-0.5">{note.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white dark:bg-primary/10 border border-primary/30 dark:text-primary text-xs font-bold py-2.5 rounded-xl hover:bg-primary/90 dark:hover:bg-primary/20 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <Link
                href="/tutor"
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white dark:bg-violet-600/10 border border-violet-500/30 dark:text-violet-300 text-xs font-bold py-2.5 rounded-xl hover:bg-violet-700 dark:hover:bg-violet-600/20 transition"
              >
                <Brain className="w-3.5 h-3.5" />
                Tutor
              </Link>
              <Link
                href="/quiz"
                className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white dark:bg-amber-600/10 border border-amber-500/30 dark:text-amber-300 text-xs font-bold py-2.5 rounded-xl hover:bg-amber-700 dark:hover:bg-amber-600/20 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Take Quiz
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── SECTIONS 5 & 6: Assessments + Resources ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Assessments Ready */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
            <SectionLabel icon={Award} label="Assessments Ready" color="text-amber-400" />
            <div className="space-y-3">
              {quizzes.map((quiz, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${quiz.status === "completed"
                    ? "bg-card border-border opacity-60"
                    : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 cursor-pointer"
                  }`}>
                  <div className={`${quiz.status === "completed" ? "bg-slate-800" : "bg-amber-500/10"} border ${quiz.status === "completed" ? "border-slate-700" : "border-amber-500/20"} p-2.5 rounded-lg flex-shrink-0`}>
                    {quiz.status === "completed"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <BookOpen className="w-4 h-4 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{quiz.title}</p>
                    <p className="text-[11px] text-text-muted">{quiz.type} • {quiz.questions} questions</p>
                  </div>
                  {quiz.status === "ready" && (
                    <Link href="/quiz" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition">
                      Start <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <Link href="/quiz" className="flex items-center justify-center gap-2 text-xs text-text-muted hover:text-amber-400 transition font-semibold mt-4 pt-4 border-t border-border">
              View All Assessments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Resources Ready */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
            <SectionLabel icon={Search} label="Resources Ready" color="text-emerald-400" />
            <div className="space-y-3">
              {resources.slice(0, 4).map((r: any, i: number) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 bg-card hover:bg-card border border-border hover:border-emerald-500/30 rounded-xl transition-all group"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex-shrink-0">
                    {r.type === "video"
                      ? <Video className="w-4 h-4 text-emerald-400" />
                      : <FileText className="w-4 h-4 text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text group-hover:text-emerald-300 transition truncate">{r.title}</p>
                    <p className="text-[11px] text-text-muted">{r.source} • {r.type}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 flex-shrink-0 transition" />
                </a>
              ))}
            </div>
            <Link href="/resources" className="flex items-center justify-center gap-2 text-xs text-text-muted hover:text-emerald-400 transition font-semibold mt-4 pt-4 border-t border-border">
              Explore Resource Library <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* ─── SECTION 7: Career Readiness ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Radial readiness */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 flex flex-col items-center justify-center text-center">
            <SectionLabel icon={Briefcase} label="Career Readiness" color="text-primary" />
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="70%" outerRadius="100%"
                  startAngle={90} endAngle={90 - (careerReadiness / 100) * 360}
                  data={radialData}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--progress-track)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-text">{careerReadiness}%</span>
                <span className="text-[10px] text-text-muted font-semibold">Ready</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap justify-center">
              {targetRoles.slice(0, 2).map((role) => (
                <span key={role} className="text-[10px] bg-primary text-primary-foreground/10 border border-indigo-500/20 text-primary px-2.5 py-1 rounded-full font-semibold">
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
            <SectionLabel icon={AlertTriangle} label="Skill Gaps" color="text-rose-400" />
            <div className="space-y-3">
              {missingSkills.map((skill, i) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-mono w-4 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${80 - i * 20}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-text-muted font-semibold min-w-[90px] text-right">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
            <SectionLabel icon={Star} label="Certifications" color="text-amber-400" />
            <div className="space-y-3">
              {certifications.map((cert, i) => (
                <div key={cert} className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                  <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">{cert}</p>
                    <p className="text-[10px] text-text-muted">Recommended certification</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── SECTION 8: Learning Velocity + Recommended Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Chart */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 lg:col-span-2">
            <SectionLabel icon={TrendingUp} label="Learning Velocity" color="text-sky-400" />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,14,28,0.95)",
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
            <SectionLabel icon={Zap} label="Recommended Actions" color="text-violet-400" />
            <div className="space-y-3">
              {[
                {
                  title: "Continue Lesson",
                  desc: continueDesc,
                  href: "/tutor",
                  icon: Brain,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                  border: "border-violet-500/20",
                },
                {
                  title: "Take Assessment",
                  desc: quizzesReady > 0 ? `${quizzesReady} assessments pending` : "No pending quizzes",
                  href: "/quiz",
                  icon: BookOpen,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/20",
                },
                {
                  title: "Explore Resources",
                  desc: `${resources.length} resources discovered`,
                  href: "/resources",
                  icon: Search,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                },
                {
                  title: "Check Analytics",
                  desc: "Review your weekly progress",
                  href: "/analytics",
                  icon: BarChart2,
                  color: "text-sky-400",
                  bg: "bg-sky-500/10",
                  border: "border-sky-500/20",
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className={`flex items-center gap-3 p-3.5 ${action.bg} border ${action.border} rounded-xl hover:scale-[1.01] transition-all group`}
                  >
                    <Icon className={`w-4 h-4 ${action.color} flex-shrink-0`} />
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${action.color}`}>{action.title}</p>
                      <p className="text-[10px] text-text-muted">{action.desc}</p>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 ${action.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
          </>
        )}
      </AppShell>
  );
}

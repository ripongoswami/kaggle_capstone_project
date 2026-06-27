"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  BarChart2, Award, Sparkles, TrendingUp, Flame, Zap,
  Target, BookOpen, Trophy, Star, Medal, Crown, Lock,
  CheckCircle2, Clock, GraduationCap, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } }
};

const BADGES = [
  {
    id: "beginner",
    label: "Roadmap Pioneer",
    desc: "Created your first custom study roadmap",
    icon: GraduationCap,
    color: "emerald",
    borderColor: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    check: (d: any) => (d?.total_lessons || 0) > 0,
  },
  {
    id: "intermediate",
    label: "Lesson Achiever",
    desc: "Completed 3 roadmap learning lessons",
    icon: BookOpen,
    color: "indigo",
    borderColor: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    iconBg: "bg-indigo-500/10",
    iconText: "text-primary",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-primary",
    check: (d: any) => (d?.completed_lessons || 0) >= 3,
  },
  {
    id: "advanced",
    label: "Quiz Master",
    desc: "Scored 80%+ average across all quizzes",
    icon: Trophy,
    color: "amber",
    borderColor: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    check: (d: any) => (d?.quiz_average || 0) >= 80 && (d?.completed_lessons || 0) >= 1,
  },
  {
    id: "expert",
    label: "Streak Legend",
    desc: "Maintained a 5+ day study streak",
    icon: Crown,
    color: "purple",
    borderColor: "border-purple-500/30",
    bg: "bg-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    check: (d: any) => (d?.streak || 0) >= 5,
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-panel px-4 py-3 rounded-xl border border-slate-700/60 text-xs shadow-xl">
        <p className="text-text-muted mb-1 font-semibold">{label}</p>
        <p className="text-primary font-bold">{payload[0]?.value} {payload[0]?.name === "hours" ? "hrs" : "%"}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/analytics/summary", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const summary = await res.json();
          setData(summary);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);



  const completionPct = data?.total_lessons > 0
    ? Math.round((data.completed_lessons / data.total_lessons) * 100)
    : 0;

  const radarData = [
    { subject: "Quizzes", A: data?.quiz_average || 0 },
    { subject: "Streak", A: Math.min((data?.streak || 0) * 10, 100) },
    { subject: "Lessons", A: completionPct },
    { subject: "Resources", A: 65 },
    { subject: "Sessions", A: Math.min((data?.total_sessions || 4) * 15, 100) },
  ];

  const activityData = data?.activity_chart?.length
    ? data.activity_chart
    : [
      { day: "Mon", hours: 1.5 },
      { day: "Tue", hours: 2.1 },
      { day: "Wed", hours: 0.8 },
      { day: "Thu", hours: 2.5 },
      { day: "Fri", hours: 1.9 },
      { day: "Sat", hours: 3.2 },
      { day: "Sun", hours: 1.1 },
    ];

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-10 space-y-8">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <Activity className="w-10 h-10 text-indigo-500 animate-pulse mb-3" />
            <span className="text-text-muted text-sm font-medium">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center border-b border-border pb-6 flex-wrap gap-4"
            >
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-text">
                  Progress Analytics
                </h1>
                <p className="text-text-muted text-sm mt-1 font-medium">
                  Detailed statistics on study patterns, performance, and learning velocity
                </p>
              </div>
              {/* <div className="flex items-center gap-2 text-xs text-text-muted bg-card border border-border px-4 py-2 rounded-xl">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live data from backend</span>
          </div> */}
            </motion.div>

            {/* Stats Row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {[
                {
                  label: "Lessons Completed",
                  value: `${data?.completed_lessons || 0} / ${data?.total_lessons || 0}`,
                  sub: `${completionPct}% completion rate`,
                  icon: BookOpen,
                  iconColor: "text-primary",
                  iconBg: "bg-indigo-500/10",
                  accent: "border-indigo-500/20",
                  glow: "shadow-primary/5",
                  badge: "text-primary bg-indigo-500/10 border-indigo-500/20",
                  badgeLabel: "Curriculum",
                },
                {
                  label: "Quiz Average",
                  value: `${data?.quiz_average || 0}%`,
                  sub: data?.quiz_average >= 80 ? "Excellent performance" : "Keep improving",
                  icon: Trophy,
                  iconColor: "text-amber-400",
                  iconBg: "bg-amber-500/10",
                  accent: "border-amber-500/20",
                  glow: "shadow-amber-600/5",
                  badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                  badgeLabel: "Mastery",
                },
                {
                  label: "Study Streak",
                  value: `${data?.streak || 0} days`,
                  sub: data?.streak >= 5 ? "Keep the fire burning!" : "Build momentum",
                  icon: Flame,
                  iconColor: "text-rose-400",
                  iconBg: "bg-rose-500/10",
                  accent: "border-rose-500/20",
                  glow: "shadow-rose-600/5",
                  badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                  badgeLabel: "Habit",
                },
                {
                  label: "Total Sessions",
                  value: `${data?.total_sessions || 0}`,
                  sub: "Learning interactions logged",
                  icon: Zap,
                  iconColor: "text-emerald-400",
                  iconBg: "bg-emerald-500/10",
                  accent: "border-emerald-500/20",
                  glow: "shadow-emerald-600/5",
                  badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  badgeLabel: "Engagement",
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className={`glass-panel p-6 rounded-2xl border ${stat.accent} shadow-lg ${stat.glow} flex flex-col justify-between gap-4 hover:border-opacity-50 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${stat.badge}`}>
                        {stat.badgeLabel}
                      </span>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-2xl font-extrabold text-text">{stat.value}</p>
                      <p className="text-xs text-text-muted mt-1">{stat.sub}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart — Study Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6 rounded-2xl border border-border space-y-4 lg:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-text text-base">Daily Study Hours</h3>
                    <p className="text-text-muted text-xs mt-0.5">Learning activity this week</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#hoursGrad)"
                        dot={{ fill: "#6366f1", strokeWidth: 2, r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Radar Chart — Skill Radar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel p-6 rounded-2xl border border-border space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-text text-base">Skill Radar</h3>
                    <p className="text-text-muted text-xs mt-0.5">Multi-dimensional progress</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Badges Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Medal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-text">Achievement Badges</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {BADGES.map((badge) => {
                  const unlocked = badge.check(data);
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.02 }}
                      className={`glass-panel p-6 rounded-2xl border flex flex-col items-center text-center space-y-3 transition-all relative overflow-hidden ${unlocked
                          ? `${badge.borderColor} ${badge.bg}`
                          : "border-border opacity-50 grayscale"
                        }`}
                    >
                      {unlocked && (
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${badge.iconBg} flex items-center justify-center`}>
                          <CheckCircle2 className={`w-3 h-3 ${badge.iconText}`} />
                        </div>
                      )}
                      {!unlocked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                          <Lock className="w-3 h-3 text-slate-600" />
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${unlocked ? badge.iconBg : "bg-slate-800"
                        }`}>
                        <Icon className={`w-7 h-7 ${unlocked ? badge.iconText : "text-slate-600"}`} />
                      </div>

                      <div>
                        <h4 className="font-bold text-text text-sm">{badge.label}</h4>
                        <p className="text-text-muted text-xs mt-1 leading-snug">{badge.desc}</p>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${unlocked ? `${badge.badgeBg} ${badge.badgeText} border ${badge.borderColor}` : "bg-slate-800 text-slate-600"
                        }`}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Progress Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-panel p-6 rounded-2xl border border-border space-y-5"
            >
              <h3 className="font-bold text-text text-base">Learning Progress Breakdown</h3>

              <div className="space-y-4">
                {[
                  { label: "Roadmap Completion", value: completionPct, color: "bg-indigo-500", track: "bg-indigo-500/10" },
                  { label: "Quiz Performance", value: data?.quiz_average || 0, color: "bg-amber-500", track: "bg-amber-500/10" },
                  { label: "Study Streak Score", value: Math.min((data?.streak || 0) * 10, 100), color: "bg-rose-500", track: "bg-rose-500/10" },
                  { label: "Overall Engagement", value: Math.min((data?.total_sessions || 0) * 8, 100), color: "bg-emerald-500", track: "bg-emerald-500/10" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-text">{item.value}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${item.track} overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AppShell>
  );
}

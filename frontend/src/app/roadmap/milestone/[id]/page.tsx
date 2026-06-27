"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  Milestone,
  CheckCircle2,
  Circle,
  Lock,
  Sparkles,
  BookOpen,
  MessageSquare,
  PlayCircle,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 85 } }
};

export default function MilestonePage() {
  const params = useParams();
  const router = useRouter();
  const milestoneIdStr = params.id as string;
  const milestoneIdx = parseInt(milestoneIdStr) - 1; // 0-indexed

  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingLesson, setStartingLesson] = useState<number | null>(null);

  const fetchRoadmap = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Offline caching: Load from cache first
    const cachedRoadmap = localStorage.getItem("roadmap_cache");
    if (cachedRoadmap) {
      try {
        setRoadmap(JSON.parse(cachedRoadmap));
        // Continue to fetch in background to refresh
      } catch (e) {
        console.warn("Invalid roadmap cache");
      }
    }

    try {
      const res = await fetch("/api/roadmap/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
        localStorage.setItem("roadmap_cache", JSON.stringify(data));
      } else if (res.status === 404) {
        if (!cachedRoadmap) router.push("/onboarding");
      }
    } catch (e) {
      console.error("Roadmap fetch error (offline?):", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [milestoneIdStr]);

  const getNextUnlockableId = (): number | null => {
    if (!roadmap) return null;
    const all: any[] = roadmap.milestones.flatMap((m: any) => m.lessons);
    for (let i = 0; i < all.length; i++) {
      if (all[i].status === "Locked") {
        if (i === 0 || all[i - 1].status === "Completed") {
          return all[i].id;
        }
        break;
      }
    }
    return null;
  };

  const nextUnlockableId = getNextUnlockableId();

  const handleStartLesson = async (lessonId: number) => {
    const token = localStorage.getItem("token");
    setStartingLesson(lessonId);
    try {
      const res = await fetch(`/api/roadmap/lesson/${lessonId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchRoadmap();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStartingLesson(null);
    }
  };



  const milestones = roadmap?.milestones || [];
  const currentMilestone = milestones[milestoneIdx];

  if (!currentMilestone) {
    return (
      <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-8 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h2 className="text-2xl font-bold">Milestone Not Found</h2>
        <p className="text-text-muted">This milestone is not generated yet or doesn&apos;t exist.</p>
        <Link href="/roadmap" className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition">
          Go back to Roadmap
        </Link>
      </AppShell>
    );
  }

  const prevMilestoneHref = milestoneIdx > 0 ? `/roadmap/milestone/${milestoneIdx}` : null;
  const nextMilestoneHref = milestoneIdx < milestones.length - 1 ? `/roadmap/milestone/${milestoneIdx + 2}` : null;

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-8 space-y-8 custom-scroll">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <Milestone className="w-12 h-12 text-indigo-500 animate-spin mb-3" />
            <span className="text-text-muted font-medium text-sm tracking-wider">Compiling Learning Path...</span>
          </div>
        ) : (
          <>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs text-primary font-semibold tracking-widest uppercase">Target Track</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-text">
              Roadmap Journey
            </h1>
            <p className="text-text-muted text-sm mt-1 font-medium">
              {roadmap?.title || "Active Study Track"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl text-primary font-bold text-xs flex items-center gap-2.5 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Overall Progress: {roadmap?.progress || 0}%</span>
            </div>
          </div>
        </motion.div>

        {/* Milestone Navigation Controls */}
        <div className="flex justify-between items-center bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-4 max-w-4xl shadow-lg shadow-black/5">
          {prevMilestoneHref ? (
            <Link href={prevMilestoneHref} className="flex items-center gap-2 text-xs text-text-muted hover:text-primary transition font-semibold">
              <ChevronLeft className="w-4 h-4" /> Previous Milestone
            </Link>
          ) : (
            <span className="text-xs text-slate-600 cursor-not-allowed">First Milestone</span>
          )}

          <span className="text-sm font-bold text-text-muted">
            Milestone {milestoneIdStr} of {milestones.length}
          </span>

          {nextMilestoneHref ? (
            <Link href={nextMilestoneHref} className="flex items-center gap-2 text-xs text-text-muted hover:text-primary transition font-semibold">
              Next Milestone <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-xs text-slate-600 cursor-not-allowed">Last Milestone</span>
          )}
        </div>

        {/* Warning Callout */}
        <div className="glass-panel border border-amber-500/15 rounded-2xl p-4 max-w-4xl flex items-start gap-3 bg-amber-500/5">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              Passing Requirement
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Milestones can only be cleared by scoring the passing grade (60%) on the lesson quiz.
            </p>
          </div>
        </div>

        {/* Milestone Detail Container */}
        <div className="max-w-4xl space-y-8">
          <div className="relative">
            {/* Milestone header */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="bg-primary/10 border border-primary/20 w-12 h-12 rounded-xl flex items-center justify-center text-primary shadow-sm">
                <Milestone className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-xl text-text tracking-tight">{currentMilestone.title}</h3>
            </motion.div>

            {/* Lessons Stack */}
            <motion.div 
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {currentMilestone.lessons.map((lesson: any) => {
                const isCompleted  = lesson.status === "Completed";
                const isCurrent    = lesson.status === "Current";
                const isLocked     = lesson.status === "Locked";
                const isUnlockable = lesson.id === nextUnlockableId;
                const isStarting   = startingLesson === lesson.id;

                return (
                  <motion.div
                    variants={cardVariants}
                    key={lesson.id}
                    className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between gap-6 glass-card-hover ${
                      isCurrent
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : isUnlockable
                        ? "border-violet-500/30 bg-violet-500/5 shadow-md"
                        : isLocked
                        ? "border-border/30 opacity-40"
                        : "border-border"
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status icon */}
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : isCurrent ? (
                          <Circle className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
                        ) : isUnlockable ? (
                          <PlayCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
                        ) : (
                          <Lock className="w-5 h-5 text-text-muted/65 flex-shrink-0" />
                        )}

                        <h4 className="font-bold text-base text-text tracking-tight">{lesson.title}</h4>

                        {/* Badges */}
                        {lesson.revision_needed && (
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            Revision Required
                          </span>
                        )}
                        {isUnlockable && (
                          <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse font-bold uppercase tracking-wider">
                            <PlayCircle className="w-3 h-3" />
                            Ready to Start
                          </span>
                        )}
                      </div>

                      <p className="text-text-muted text-sm pl-8 leading-relaxed max-w-2xl">
                        {lesson.description}
                      </p>
                      <div className="text-xs text-text-muted pl-8 font-medium">
                        Duration: {lesson.estimated_time} minutes
                      </div>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-3 pl-8 md:pl-0 flex-shrink-0">
                      {isCurrent && (
                        <>
                          <Link
                            href="/tutor"
                            className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Study with Tutor
                          </Link>
                          <Link
                            href="/quiz"
                            className="bg-amber-600 text-black dark:bg-amber-600/10 border border-amber-500/30 dark:text-amber-300 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-700 dark:hover:bg-amber-600/20 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            Take Quiz
                          </Link>
                        </>
                      )}

                      {isUnlockable && (
                        <button
                          id={`start-lesson-${lesson.id}`}
                          onClick={() => handleStartLesson(lesson.id)}
                          disabled={isStarting}
                          className="bg-violet-600 text-white dark:bg-violet-600/10 border border-violet-500/30 dark:text-violet-300 hover:bg-violet-750 dark:hover:bg-violet-600/20 text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-violet-600/10 cursor-pointer"
                        >
                          {isStarting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                          {isStarting ? "Starting..." : "Start Module"}
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                          Passed
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
        </>
        )}
      </AppShell>
  );
}

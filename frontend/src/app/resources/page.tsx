"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Search, BookmarkCheck, Bookmark, Star, ExternalLink,
  Loader2, Sparkles, Clock, User, Layers,
  X, SlidersHorizontal, Compass, Youtube, Newspaper,
  FileSearch, BookMarked, GraduationCap, TrendingUp, Zap,
  ArrowUpDown, Target, RefreshCw, AlertCircle, CheckCircle2,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
type ResourceType = "YouTube" | "Article" | "PDF" | "Book" | "Course" | "Docs" | "Career";

interface Resource {
  id?: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  author?: string;
  duration?: string;
  level?: string;
  tags?: string[];
  relevance_score: number;
  source_domain?: string;
}

interface ResourceCache {
  goal: string;          // the goal used to generate these
  resources: Resource[];
  fetchedAt: number;     // timestamp ms
}

// ── Cache helpers ─────────────────────────────────────────────────────────
const CACHE_NAMESPACE = "eduverse_resources_v1";

/** Normalize goal to a stable cache key */
function goalKey(goal: string) {
  return `${CACHE_NAMESPACE}::${goal.trim().toLowerCase().replace(/\s+/g, "_")}`;
}

function readCache(goal: string): ResourceCache | null {
  try {
    const raw = localStorage.getItem(goalKey(goal));
    if (!raw) return null;
    return JSON.parse(raw) as ResourceCache;
  } catch {
    return null;
  }
}

function writeCache(goal: string, resources: Resource[]) {
  try {
    const payload: ResourceCache = { goal, resources, fetchedAt: Date.now() };
    localStorage.setItem(goalKey(goal), JSON.stringify(payload));
  } catch {
    /* storage full — ignore */
  }
}

/** Format "fetched 3 minutes ago" */
function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Type badge config ──────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { bg: string; text: string; border: string; icon: any; bar: string }> = {
  YouTube:  { bg: "bg-red-500/10",    text: "text-red-600 dark:text-red-400",    border: "border-red-500/20",    icon: Youtube,       bar: "from-red-500/60"    },
  Article:  { bg: "bg-sky-500/10",    text: "text-sky-600 dark:text-sky-400",    border: "border-sky-500/20",    icon: Newspaper,     bar: "from-sky-500/60"    },
  PDF:      { bg: "bg-rose-500/10",   text: "text-rose-600 dark:text-rose-400",   border: "border-rose-500/20",   icon: FileSearch,    bar: "from-rose-500/60"   },
  Book:     { bg: "bg-amber-500/10",  text: "text-amber-600 dark:text-amber-400",  border: "border-amber-500/20",  icon: BookMarked,    bar: "from-amber-500/60"  },
  Course:   { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20", icon: GraduationCap, bar: "from-violet-500/60" },
  Docs:     { bg: "bg-sky-500/10",    text: "text-sky-600 dark:text-sky-400",    border: "border-sky-500/20",    icon: FileSearch,    bar: "from-sky-500/60"    },
  Career:   { bg: "bg-emerald-500/10",text: "text-emerald-600 dark:text-emerald-400",border: "border-emerald-500/20",icon: Target,        bar: "from-emerald-500/60"},
};

const LEVEL_COLOR: Record<string, string> = {
  Beginner:     "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Intermediate: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  Advanced:     "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  "All Levels": "text-text-muted bg-card border-border",
};

const SORT_OPTIONS = ["Relevance", "Title A–Z", "Title Z–A"];

const INTENTS = [
  { id: "resources", label: "Resources" },
  { id: "docs",      label: "Docs"      },
  { id: "courses",   label: "Courses"   },
  { id: "books",     label: "Books"     },
  { id: "career",    label: "Career"    },
];

// ── Fallback Globe SVG ────────────────────────────────────────────────────
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────
function ResourceCard({
  resource, isBookmarked, onToggleBookmark,
}: {
  resource: Resource;
  isBookmarked: boolean;
  onToggleBookmark: (r: Resource) => void;
}) {
  const badge = TYPE_BADGE[resource.type] ?? {
    bg: "bg-secondary border-border", text: "text-text-muted", border: "border-border",
    icon: GlobeIcon, bar: "from-slate-400/60 dark:from-slate-600/60",
  };
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 130, damping: 22 }}
      className="group bg-card/40 backdrop-blur-3xl shadow-xl shadow-black/5 rounded-[2rem] border border-border/40 hover:border-border hover:scale-[1.02] transition-all duration-300 flex flex-col overflow-hidden"
    >
      <div className={`h-1 w-full bg-gradient-to-r ${badge.bar} to-transparent`} />

      <div className="p-6 flex flex-col flex-1 gap-5">
        {/* Badge + bookmark */}
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
            <BadgeIcon className="w-3 h-3" />
            {resource.type}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {resource.relevance_score > 0 && (
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400" />
                {resource.relevance_score.toFixed(2)}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => onToggleBookmark(resource)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isBookmarked
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Title + Description */}
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-text text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {resource.title?.replace(/#+\s?/g, " ")}
          </h3>
          <p className="text-text-muted text-xs leading-relaxed line-clamp-3">
            {resource.description?.replace(/#+\s?/g, " ")}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {resource.author && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <User className="w-3 h-3" /> {resource.author}
            </span>
          )}
          {resource.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="w-3 h-3" /> {resource.duration}
            </span>
          )}
          {resource.level && resource.level !== "All Levels" && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[resource.level] ?? LEVEL_COLOR["All Levels"]}`}>
              <Layers className="w-2.5 h-2.5" /> {resource.level}
            </span>
          )}
          {resource.source_domain && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 truncate">
              🌐 {resource.source_domain}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary transition-colors group/link"
            >
              Open Resource
              <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </a>
          ) : (
            <span className="text-xs text-slate-600">No link available</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card/40 backdrop-blur-3xl shadow-xl shadow-black/5 rounded-[2rem] border border-border/40 p-6 flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="h-6 w-20 rounded-full bg-progress-track animate-pulse" />
        <div className="h-6 w-12 rounded-full bg-progress-track animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-progress-track animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-progress-track animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-progress-track/60 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-progress-track/60 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-progress-track/60 animate-pulse" />
      </div>
      <div className="h-px bg-progress-track" />
      <div className="h-4 w-24 rounded bg-progress-track/60 animate-pulse" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  // User profile
  const [userGoal, setUserGoal]       = useState<string>("");
  const [userLevel, setUserLevel]     = useState<string>("");
  const [profileReady, setProfileReady] = useState(false);

  // Resources state
  const [resources, setResources]     = useState<Resource[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [offset, setOffset]           = useState(0);
  const [hasMore, setHasMore]         = useState(true);

  // Source metadata
  const [isFromCache, setIsFromCache]         = useState(false);
  const [cachedAt, setCachedAt]               = useState<number | null>(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [isManualSearch, setIsManualSearch]   = useState(false);

  // UI controls
  const [query, setQuery]           = useState("");
  const [activeIntent, setActiveIntent] = useState("resources");
  const [activeType, setActiveType] = useState<string>("All");
  const [sortBy, setSortBy]         = useState("Relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [showBookmarksOnly, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks]   = useState<Resource[]>([]);

  // Prevent double-fetch on strict mode double effect
  const fetchedGoalRef = useRef<string | null>(null);

  // ── Bookmarks persistence ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("eduverse_bookmarks");
      if (saved) setBookmarks(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveBookmarks = (updated: Resource[]) => {
    setBookmarks(updated);
    localStorage.setItem("eduverse_bookmarks", JSON.stringify(updated));
  };

  const toggleBookmark = (res: Resource) => {
    const exists = bookmarks.some((b) => b.url === res.url);
    saveBookmarks(exists
      ? bookmarks.filter((b) => b.url !== res.url)
      : [...bookmarks, res]
    );
  };

  // ── Core API fetch ────────────────────────────────────────────────────
  const fetchFromAPI = useCallback(async (
    searchQuery: string,
    intent: string,
    limit = 20,
    offsetVal = 0,
    forceRefresh = false
  ): Promise<Resource[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `/api/resources/search?query=${encodeURIComponent(searchQuery)}&intent=${intent}&limit=${limit}&offset=${offsetVal}&force_refresh=${forceRefresh}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.resources ?? [];
  }, []);

  // ── Load goal resources (cache-first) ─────────────────────────────────
  const loadGoalResources = useCallback(async (
    goal: string,
    force = false,           // force = bypass cache (Refresh button)
  ) => {
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);
    setIsFromCache(false);
    setIsManualSearch(false);
    setActiveType("All");
    setOffset(0);

    try {
      const results = await fetchFromAPI(goal, "resources", 20, 0, force);
      setResources(results);
      setCurrentSearchTerm(goal);
      setCachedAt(Date.now());
      setOffset(20);
      setHasMore(results.length === 20);
      setIsFromCache(!force);
      
      // Save client cache fallback
      writeCache(goal, results);
    } catch {
      setError("Could not fetch resources. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchFromAPI]);

  // ── Manual user search (does NOT overwrite goal cache) ───────────────
  const handleManualSearch = useCallback(async (term?: string) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setIsFromCache(false);
    setIsManualSearch(true);
    setActiveType("All");
    setOffset(0);

    try {
      const results = await fetchFromAPI(q, activeIntent, 20, 0, false);
      setResources(results);
      setCurrentSearchTerm(q);
      setOffset(20);
      setHasMore(results.length === 20);
      setCachedAt(null);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, activeIntent, fetchFromAPI]);

  // ── Load More action ──────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    
    try {
      const term = currentSearchTerm || query || userGoal;
      const intent = isManualSearch ? activeIntent : "resources";
      const results = await fetchFromAPI(term, intent, 20, offset, false);
      
      if (results.length > 0) {
        setResources((prev) => {
          const existingUrls = new Set(prev.map(r => r.url));
          const newItems = results.filter(r => !existingUrls.has(r.url));
          return [...prev, ...newItems];
        });
        setOffset((prev) => prev + 20);
      }
      setHasMore(results.length === 20);
    } catch {
      setError("Failed to load more resources.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, currentSearchTerm, query, userGoal, isManualSearch, activeIntent, fetchFromAPI]);

  // ── On mount: load profile → cache-first load ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setProfileReady(true); return; }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setProfileReady(true); return; }
        const user = await res.json();
        const goal  = (user.goal ?? "").trim();
        const level = user.skill_level ?? "";

        if (cancelled) return;
        setUserGoal(goal);
        setUserLevel(level);
        setProfileReady(true);

        if (goal && fetchedGoalRef.current !== goal) {
          fetchedGoalRef.current = goal;
          setQuery(goal); // pre-fill search box with goal
          await loadGoalResources(goal); // cache-first
        }
      } catch {
        if (!cancelled) setProfileReady(true);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [loadGoalResources]);

  // ── Related topic suggestions ─────────────────────────────────────────
  const relatedTopics = useMemo(() => {
    if (!userGoal) return [];
    const base = userGoal.toLowerCase();
    const map: Record<string, string[]> = {
      python:      ["Python OOP", "Python async/await", "Python data science", "Python REST APIs"],
      javascript:  ["React hooks", "Node.js basics", "TypeScript essentials", "JavaScript promises"],
      machine:     ["Neural networks", "scikit-learn", "Deep learning", "LLMs & transformers"],
      ai:          ["Prompt engineering", "LangChain", "Vector databases", "Retrieval Augmented Generation"],
      web:         ["CSS flexbox & grid", "REST API design", "Docker basics", "Authentication patterns"],
      data:        ["Pandas & NumPy", "SQL joins", "Data visualization", "Feature engineering"],
      react:       ["Next.js 14", "React state management", "Tailwind CSS", "React testing"],
      java:        ["Spring Boot", "Java concurrency", "JVM internals", "Maven & Gradle"],
      cloud:       ["AWS fundamentals", "Kubernetes", "Terraform", "CI/CD pipelines"],
      devops:      ["Docker & containers", "GitHub Actions", "Monitoring & alerting", "Linux fundamentals"],
    };
    const key = Object.keys(map).find((k) => base.includes(k));
    return key
      ? map[key]
      : [`${userGoal} tutorial`, `${userGoal} projects`, `${userGoal} interview prep`, `${userGoal} advanced`];
  }, [userGoal]);

  // ── Filtered + sorted display list ────────────────────────────────────
  const displayedResources = useMemo(() => {
    let list = showBookmarksOnly ? bookmarks : resources;
    if (activeType !== "All") list = list.filter((r) => r.type === activeType);
    if (sortBy === "Title A–Z") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Title Z–A") list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    else list = [...list].sort((a, b) => b.relevance_score - a.relevance_score);
    return list;
  }, [resources, bookmarks, showBookmarksOnly, activeType, sortBy]);

  const availableTypes = useMemo(() =>
    ["All", ...Array.from(new Set((showBookmarksOnly ? bookmarks : resources).map((r) => r.type)))],
    [resources, bookmarks, showBookmarksOnly],
  );

  const isInitializing = !profileReady;

  return (
    <AppShell mainClassName="flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-5 border-b border-border space-y-4 sm:space-y-5">

          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-text">
                Resource Discovery
              </h1>
              {userGoal ? (
                <p className="text-text-muted text-sm mt-1.5 flex items-center gap-2 flex-wrap">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  Resources for:
                  <span className="text-primary font-bold">{userGoal}</span>
                  {userLevel && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[userLevel] ?? LEVEL_COLOR["All Levels"]}`}>
                      {userLevel}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-text-muted text-sm mt-1">Search videos, articles, PDFs, books & courses</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Refresh — force re-fetch and re-save cache */}
              {userGoal && !isManualSearch && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => loadGoalResources(userGoal, true)}
                  disabled={loading}
                  title="Force refresh — re-fetches and updates saved data"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-text-muted hover:border-primary/30 hover:text-primary text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </motion.button>
              )}

              {/* Back to goal (when in manual search mode) */}
              {isManualSearch && userGoal && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setQuery(userGoal);
                    setIsManualSearch(false);
                    loadGoalResources(userGoal);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-primary text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:bg-indigo-500/15"
                >
                  <Target className="w-3.5 h-3.5" />
                  Back to My Goal
                </motion.button>
              )}

              {/* Bookmarks */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBookmarks(!showBookmarksOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  showBookmarksOnly
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-primary"
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                Saved
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  showBookmarksOnly ? "bg-emerald-400 text-emerald-950" : "bg-secondary text-text-muted"
                }`}>{bookmarks.length}</span>
              </motion.button>
              {/* Filters */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  showFilters
                    ? "border-indigo-500/50 bg-indigo-500/10 text-primary"
                    : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-primary"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </motion.button>
            </div>
          </div>

          {/* ── Cache status badge ─────────────────────────────────────── */}
          <AnimatePresence>
            {false && isFromCache && cachedAt && !showBookmarksOnly && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 px-3.5 py-2 rounded-xl w-fit"
              >
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Loaded from saved data · fetched <strong>{timeAgo(cachedAt)}</strong>
                </span>
                <span className="text-emerald-600 mx-1">·</span>
                <button
                  onClick={() => loadGoalResources(userGoal, true)}
                  className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300 cursor-pointer transition font-semibold"
                >
                  refresh
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Search bar ─────────────────────────────────────────────── */}
          {!showBookmarksOnly && (
            <div className="space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleManualSearch(); }}
                className="flex gap-3 max-w-3xl"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    id="resource-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      userGoal
                        ? `Searching for "${userGoal}" — or type to search anything else`
                        : "Search topics, courses, books, videos..."
                    }
                    className="w-full bg-card/80 border border-border rounded-xl py-3.5 pl-11 pr-10 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition text-sm"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(userGoal);
                        if (isManualSearch) {
                           setIsManualSearch(false);
                           loadGoalResources(userGoal);
                        }
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <select
                  value={activeIntent}
                  onChange={(e) => setActiveIntent(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-3.5 text-text-muted text-xs font-semibold focus:outline-none focus:border-indigo-500/70 transition cursor-pointer"
                >
                  {INTENTS.map((i) => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-primary text-primary-foreground hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-primary/15 flex items-center gap-2 cursor-pointer"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4" />
                  }
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Related topic chips — only when showing goal data */}
              {!isManualSearch && relatedTopics.length > 0 && !loading && (
                <div className="flex items-center gap-2 flex-wrap">
                  <TrendingUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <span className="text-xs text-text-muted">Related to your goal:</span>
                  {relatedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleManualSearch(topic)}
                      className="text-xs px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-primary hover:bg-indigo-500/12 hover:border-indigo-500/40 transition cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-[11px] text-text-muted font-medium">
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Sort:</span>
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                        sortBy === s
                          ? "border-indigo-500 bg-indigo-500/10 text-primary"
                          : "border-border bg-card text-text-muted hover:text-primary hover:border-primary/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Type filter tabs ────────────────────────────────────────── */}
        {!showBookmarksOnly && displayedResources.length > 0 && (
          <div className="flex-shrink-0 px-8 py-3 border-b border-border flex items-center gap-2 flex-wrap">
            {availableTypes.map((type) => {
              const badge = TYPE_BADGE[type];
              const BadgeIcon = badge?.icon;
              const count = type === "All"
                ? resources.length
                : resources.filter((r) => r.type === type).length;
              const isActive = activeType === type;
              return (
                <button
                  key={type}
                  id={`filter-${type.toLowerCase()}`}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "border-indigo-500 bg-indigo-500/10 text-primary"
                      : "border-border bg-card text-text-muted hover:text-primary hover:border-primary/30"
                  }`}
                >
                  {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                  {type}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-primary/15 text-primary" : "bg-secondary text-text-muted"
                  }`}>{count}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{displayedResources.length} results</span>
            </div>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">

          {/* Skeleton — initial load */}
          {(isInitializing || (loading && resources.length === 0)) && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-text-muted text-sm">
                <Compass className="w-5 h-5 text-indigo-500 animate-spin" />
                <span>
                  {userGoal
                    ? <>Loading resources for <span className="text-primary font-bold">"{userGoal}"</span>…</>
                    : "Loading your resources…"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {/* Re-search spinner (has existing results) */}
          {loading && resources.length > 0 && (
            <div className="flex items-center gap-2 text-text-muted text-xs mb-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Updating results…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-4 py-3 rounded-xl mb-5 max-w-2xl"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Bookmarks empty */}
          {!loading && showBookmarksOnly && bookmarks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold text-text text-lg">No saved resources yet</h3>
              <p className="text-text-muted text-sm max-w-sm">
                Click the bookmark icon on any card to save it for quick access later.
              </p>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-sm text-primary hover:text-primary font-semibold cursor-pointer transition"
              >
                Browse resources →
              </button>
            </motion.div>
          )}

          {/* No results / Popular Topics */}
          {!loading && !isInitializing && !showBookmarksOnly && profileReady && resources.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col py-10 space-y-8"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-text text-xl">Explore Popular Topics</h3>
                <p className="text-text-muted text-sm max-w-md mx-auto">
                  {userGoal 
                    ? "We couldn't find specific resources for your goal right now. Try searching or explore these popular topics."
                    : "Start your learning journey by exploring some of our most popular technology domains."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
                {[
                  { title: "React & Next.js", icon: <Layers className="w-5 h-5" />, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
                  { title: "Python Data Science", icon: <Database className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  { title: "Generative AI", icon: <Sparkles className="w-5 h-5" />, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                  { title: "Cloud & DevOps", icon: <TrendingUp className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                  { title: "System Design", icon: <Target className="w-5 h-5" />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                  { title: "Algorithms", icon: <Zap className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                ].map((topic) => (
                  <button
                    key={topic.title}
                    onClick={() => handleManualSearch(topic.title)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border bg-card/50 hover:bg-card transition-all cursor-pointer text-left hover:scale-[1.02] ${topic.border}`}
                  >
                    <div className={`p-3 rounded-xl ${topic.bg} ${topic.color}`}>
                      {topic.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-text text-sm">{topic.title}</h4>
                      <p className="text-xs text-text-muted mt-1">Explore resources →</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results grid */}
          {!loading && !isInitializing && displayedResources.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  {isManualSearch
                    ? <><Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>
                          <span className="text-text font-bold">{displayedResources.length}</span> results for{" "}
                          <span className="text-primary font-bold">"{currentSearchTerm}"</span>
                        </span>
                      </>
                    : <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          <span className="text-text font-bold">{displayedResources.length}</span> resources for your goal{" "}
                          <span className="text-primary font-bold">"{currentSearchTerm}"</span>
                        </span>
                      </>
                  }
                </div>
              </div>

              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                  {displayedResources.map((res, i) => (
                    <ResourceCard
                      key={res.url ?? i}
                      resource={res}
                      isBookmarked={bookmarks.some((b) => b.url === res.url)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {hasMore && !showBookmarksOnly && (
                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 text-primary text-sm font-semibold transition cursor-pointer disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Load More Resources
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
  );
}

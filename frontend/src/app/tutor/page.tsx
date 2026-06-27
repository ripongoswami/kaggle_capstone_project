"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  MessageSquare, Send, Sparkles, GraduationCap, Copy, Check,
  Brain, BookOpen, ChevronDown, ChevronUp, FileText, Zap,
  RefreshCw, PanelRightClose, PanelRightOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Code Block Component ──────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50 font-mono text-xs my-3 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border text-text-muted">
        <span className="uppercase text-[10px] font-bold tracking-widest text-primary">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="hover:text-text transition flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 text-[10px] cursor-pointer"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-text-muted leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Inline Markdown Parser ────────────────────────────────────────
function parseInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-bold text-text">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-card/50 px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-border">{part.slice(1, -1)}</code>;
    return part;
  });
}

// ─── Full Markdown Renderer (for study notes panel) ───────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-extrabold text-text mt-4 mb-2 border-b border-border pb-2">{line.slice(2)}</h2>;
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold text-primary mt-3 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith("### ")) return <h4 key={i} className="text-sm font-bold text-violet-300 mt-2 mb-1">{line.slice(4)}</h4>;
        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <div key={i} className="flex gap-2">
            <span className="text-primary flex-shrink-0 mt-0.5">•</span>
            <p className="text-text-muted">{parseInlineMarkdown(line.slice(2))}</p>
          </div>
        );
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary font-mono text-xs flex-shrink-0 mt-0.5">{num}.</span>
              <p className="text-text-muted">{parseInlineMarkdown(rest.join(". "))}</p>
            </div>
          );
        }
        if (line.startsWith("```")) return null; // handled at block level
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-text-muted">{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

// ─── Chat Message Content ─────────────────────────────────────────
function MessageContent({ content, role }: { content: string; role: string }) {
  if (role === "user") return <div className="whitespace-pre-wrap font-medium">{content}</div>;

  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={i} code={code} lang={lang} />;
        }
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed text-text text-sm">
            {parseInlineMarkdown(part)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Default Study Notes ──────────────────────────────────────────
const DEFAULT_NOTES = `# Data Structures & Algorithms

## What You'll Learn
Master the fundamental building blocks of computer science that power every piece of software.

## Core Data Structures

### Arrays & Lists
- **Array**: Fixed-size sequential collection, O(1) access by index
- **Dynamic Array** (Python list): Grows automatically, amortized O(1) append
- Use arrays when you need fast random access

### Linked Lists
- Each node points to the next — sequential access only
- O(1) insert/delete at head, O(n) search
- Memory efficient for unknown-size collections

### Stacks & Queues
- **Stack**: LIFO — Last In, First Out (think: browser back button)
- **Queue**: FIFO — First In, First Out (think: print queue)

### Hash Maps (Dictionaries)
- Key-value storage with O(1) average lookup
- Perfect for counting, caching, and fast searches

## Algorithmic Complexity

### Big O Notation
- **O(1)** — Constant time (hash map lookup)
- **O(log n)** — Logarithmic (binary search)
- **O(n)** — Linear (array iteration)
- **O(n log n)** — Linearithmic (merge sort)
- **O(n²)** — Quadratic (nested loops — avoid!)

## Binary Search
Divide the sorted array in half each time:
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

## Key Takeaways
- Always consider time AND space complexity
- Choose data structures based on your access patterns
- Practice LeetCode problems with these structures!`;

// ─── Main Tutor Page ──────────────────────────────────────────────
export default function TutorPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [studyNotes, setStudyNotes] = useState<string>(DEFAULT_NOTES);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "resources">("notes");
  const [mobilePanel, setMobilePanel] = useState<"notes" | "chat">("notes");
  const [saved, setSaved] = useState(false);
  const [panelWidth, setPanelWidth] = useState(45); // percentage (default 45%)
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startResize = () => {
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const updatePanelWidth = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    if (percentage >= 20 && percentage <= 80) {
      setPanelWidth(percentage);
    }
  };

  const suggestedPrompts = [
    { text: "Explain Big O Notation with examples", detail: "Understand time complexity" },
    { text: "How does binary search work?", detail: "Divide-and-conquer approach" },
    { text: "Quiz me on data structures", detail: "Test your knowledge" },
    { text: "Give me a coding challenge", detail: "Practice with exercises" },
  ];

  const fetchActiveLessonAndHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Offline caching: Load from cache first
    const cachedLesson = localStorage.getItem("tutor_active_lesson");
    const cachedHistory = localStorage.getItem("tutor_chat_history");
    
    if (cachedLesson) {
      try {
        const current = JSON.parse(cachedLesson);
        setActiveLesson(current);
        if (current.study_notes) setStudyNotes(current.study_notes);
        if (current.resources) {
          setResources(typeof current.resources === "string" ? JSON.parse(current.resources) : current.resources);
        }
      } catch (e) {
        console.warn("Invalid tutor lesson cache");
      }
    }
    
    if (cachedHistory) {
      try {
        setMessages(JSON.parse(cachedHistory));
      } catch (e) {
        console.warn("Invalid tutor history cache");
      }
    }

    try {
      // Fetch active lesson
      const activeRes = await fetch("/api/roadmap/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeRes.ok) {
        const data = await activeRes.json();
        const current = data.milestones
          ?.flatMap((m: any) => m.lessons)
          .find((l: any) => l.status === "Current");
        if (current) {
          setActiveLesson(current);
          localStorage.setItem("tutor_active_lesson", JSON.stringify(current));
          if (current.study_notes) setStudyNotes(current.study_notes);
          if (current.resources) {
            try {
              const parsed = typeof current.resources === "string" ? JSON.parse(current.resources) : current.resources;
              setResources(parsed);
            } catch (e) {
              setResources([]);
            }
          }
        }
      }

      // Fetch chat history
      const historyRes = await fetch("/api/tutor/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (historyRes.ok) {
        const data = await historyRes.json();
        setMessages(data);
        localStorage.setItem("tutor_chat_history", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to load study console (offline?):", err);
    }
  };

  useEffect(() => {
    fetchActiveLessonAndHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      updatePanelWidth(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizingRef.current || !e.touches[0]) return;
      e.preventDefault();
      updatePanelWidth(e.touches[0].clientX);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  const sendQuery = async (queryText: string) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: "user", content: queryText }]);
    setLoading(true);

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: queryText,
          lesson_id: activeLesson?.id || null,
        }),
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        for (const line of chunkText.split("\n")) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") continue;
            try {
              const obj = JSON.parse(dataStr);
              if (obj.chunk) {
                accumulated += obj.chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulated };
                  return updated;
                });
              }
            } catch { }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error communicating with AI Tutor. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    await sendQuery(msg);
  };

  const handleReloadConsole = async () => {
    if (!activeLesson || reloading) return;
    setReloading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/roadmap/lesson/${activeLesson.id}/regenerate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedLesson = await res.json();
        setActiveLesson(updatedLesson);
        if (updatedLesson.study_notes) {
          setStudyNotes(updatedLesson.study_notes);
        }
        if (updatedLesson.resources) {
          try {
            const parsed = JSON.parse(updatedLesson.resources);
            setResources(parsed);
          } catch (e) {
            setResources([]);
          }
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Reload console error:", e);
    } finally {
      setReloading(false);
    }
  };

  const defaultResources = [
    { title: `Mastering ${activeLesson?.title || "Python"} Concepts`, type: "video", source: "YouTube", url: "https://youtube.com" },
    { title: `${activeLesson?.title || "Python"} Official Documentation`, type: "article", source: "Documentation", url: "https://docs.python.org" },
    { title: `Interactive Exercises for ${activeLesson?.title || "Python"}`, type: "course", source: "FreeCodeCamp", url: "https://freecodecamp.org" },
    { title: `${activeLesson?.title || "Python"} Deep Dive Tutorial`, type: "video", source: "CS Dojo", url: "https://youtube.com" },
    { title: `Common Patterns & Best Practices in ${activeLesson?.title || "Python"}`, type: "article", source: "Medium", url: "https://medium.com" },
    { title: `Advanced Cheat Sheet for ${activeLesson?.title || "Python"}`, type: "article", source: "GitHub", url: "https://github.com" },
  ];

  const displayResources = resources.length >= 4 ? resources : defaultResources;

  return (
    <AppShell mainClassName="flex flex-col overflow-hidden min-h-0 p-0">
      {/* Saved Toast Alert */}
      {saved && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 border border-emerald-500 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-slide-in">
          <Check className="w-5 h-5" />
          <span className="font-semibold text-sm">Study console regenerated successfully!</span>
        </div>
      )}

      {/* Mobile panel switcher — only below lg */}
      <div className="lg:hidden flex-shrink-0 flex border-b border-border bg-card/50">
        <button
          onClick={() => setMobilePanel("notes")}
          className={`flex-1 py-3 text-xs font-bold transition ${mobilePanel === "notes" ? "text-primary border-b-2 border-primary" : "text-text-muted"}`}
        >
          Study Notes
        </button>
        <button
          onClick={() => setMobilePanel("chat")}
          className={`flex-1 py-3 text-xs font-bold transition ${mobilePanel === "chat" ? "text-primary border-b-2 border-primary" : "text-text-muted"}`}
        >
          AI Tutor Chat
        </button>
      </div>

      {/* Split-screen area */}
      <div ref={containerRef} className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

        {/* ════ LEFT PANEL: Study Notes ════ */}
        <div
          style={{ width: chatCollapsed ? "100%" : `${panelWidth}%` }}
          className={`${mobilePanel === "chat" ? "hidden lg:flex" : "flex"} flex-col lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border/50 h-[50%] lg:h-full min-h-0 overflow-hidden bg-card/30 backdrop-blur-sm ${isResizing ? "pointer-events-none select-none" : "transition-all duration-75"}`}
        >

          {/* Panel header */}
          <div className="px-6 py-4 border-b border-border/50 glass-panel bg-background/60 flex items-center justify-between flex-shrink-0 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-text text-sm tracking-tight">Study Console</h2>
                <p className="text-[11px] text-text-muted">
                  {activeLesson ? activeLesson.title : "Data Structures & Algorithms"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="p-1.5 bg-background dark:bg-card hover:bg-primary/10 dark:hover:bg-primary/15 rounded-lg text-text-muted hover:text-primary transition flex items-center gap-1.5 text-[10px] font-bold border border-border hover:border-primary/30 cursor-pointer shadow-sm"
                title={chatCollapsed ? "Open AI Chat" : "Collapse AI Chat"}
              >
                {chatCollapsed ? <PanelRightOpen className="w-3.5 h-3.5 text-primary animate-pulse" /> : <PanelRightClose className="w-3.5 h-3.5 text-primary" />}
                <span>{chatCollapsed ? "Open Chat" : "Hide Chat"}</span>
              </button>

              <button
                onClick={handleReloadConsole}
                disabled={reloading || !activeLesson}
                className="p-1.5 bg-background dark:bg-card hover:bg-primary/10 dark:hover:bg-primary/15 rounded-lg text-text-muted hover:text-primary transition flex items-center gap-1.5 text-[10px] font-bold border border-border hover:border-primary/30 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Reload Console"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${reloading ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`p-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer shadow-sm ${
                  activeTab === "notes"
                    ? "bg-primary text-white border-primary hover:bg-primary/90"
                    : "bg-background dark:bg-card text-text-muted border-border hover:bg-primary/10 dark:hover:bg-primary/15 hover:text-primary hover:border-primary/30"
                }`}
              >
                Notes
              </button>

              <button
                onClick={() => setActiveTab("resources")}
                className={`p-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer shadow-sm ${
                  activeTab === "resources"
                    ? "bg-primary text-white border-primary hover:bg-primary/90"
                    : "bg-background dark:bg-card text-text-muted border-border hover:bg-primary/10 dark:hover:bg-primary/15 hover:text-primary hover:border-primary/30"
                }`}
              >
                Links
              </button>
            </div>
          </div>

          {/* Lesson context badge */}
          {activeLesson && (
            <div className="px-6 py-2.5 bg-card border-b border-border flex items-center gap-2 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              <span className="text-[11px] text-text font-semibold">
                Active Lesson: {activeLesson.title}
              </span>
              <span className="ml-auto bg-primary/10 border border-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                In Progress
              </span>
            </div>
          )}

          {/* Panel content */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
            {activeTab === "notes" ? (
              <div className="p-6">
                {/* Agent-generated badge */}
                <div className="flex items-center gap-2 mb-5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] text-text-muted font-semibold">
                    Generated by Tutor Agent — Pre-loaded for this lesson
                  </span>
                </div>

                {/* Study notes markdown */}
                <div className="prose-custom">
                  <MarkdownRenderer content={studyNotes} />
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-2.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-300 font-semibold">
                    Curated by Research Agent — Dynamic Resources
                  </span>
                </div>
                {displayResources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3.5 p-4 bg-card hover:bg-card border border-border hover:border-emerald-500/30 rounded-xl transition-all group"
                  >
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg flex-shrink-0">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text group-hover:text-emerald-300 transition">{r.title}</p>
                      <p className="text-[11px] text-text-muted">{r.source || "Web"} • {r.type || "Article"}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE SLIDER / SPLITTER — desktop only */}
        {!chatCollapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              startResize();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              startResize();
            }}
            className="hidden lg:flex w-[6px] hover:w-[8px] bg-border/20 hover:bg-primary/50 cursor-col-resize flex-shrink-0 items-center justify-center transition-all group touch-none"
          >
            <div className="h-8 w-[2px] bg-slate-400 dark:bg-slate-700 group-hover:bg-primary rounded animate-pulse" />
          </div>
        )}

        {/* ════ RIGHT PANEL: AI Chat ════ */}
        {!chatCollapsed && (
          <div className={`${mobilePanel === "notes" ? "hidden lg:flex" : "flex"} flex-1 flex-col h-[50%] lg:h-full min-h-0 overflow-hidden transition-all duration-300 bg-card/10 ${isResizing ? "pointer-events-none select-none" : ""}`}>

            {/* Chat header */}
            <div className="px-6 py-4 border-b border-border/50 glass-panel bg-background/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-text text-sm tracking-tight">AI Tutor Chat</h2>
                  <p className="text-[11px] text-text-muted">
                    {activeLesson ? `Context: ${activeLesson.title}` : "Open chat — Ask anything"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeLesson && (
                  <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-primary text-[10px] font-bold uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Contextual Mode
                  </div>
                )}

                <button
                  onClick={() => setChatCollapsed(true)}
                  className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text transition md:hidden"
                  title="Collapse Chat"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scroll">
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 my-auto">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-primary/10 border border-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center text-primary mx-auto"
                  >
                    <Sparkles className="w-7 h-7 animate-pulse" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg text-text mb-1">Ask Your AI Tutor</h3>
                    <p className="text-text-muted text-xs leading-relaxed">
                      I&apos;ve already read your study notes. Ask me to explain concepts, provide examples, or quiz you.
                    </p>
                  </div>

                  {/* Suggested prompts */}
                  <div className="grid grid-cols-1 gap-2.5 w-full">
                    {suggestedPrompts.map((p, idx) => (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        key={p.text}
                        onClick={() => sendQuery(p.text)}
                        type="button"
                        className="bg-card/45 border border-border/40 hover:border-primary/45 p-3.5 rounded-xl text-left transition hover:scale-[1.01] group cursor-pointer shadow-lg shadow-black/5"
                      >
                        <h4 className="font-semibold text-text text-xs group-hover:text-primary transition">{p.text}</h4>
                        <p className="text-text-muted text-[10px] mt-0.5">{p.detail}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl bg-primary border border-primary/20 flex items-center justify-center flex-shrink-0 mr-2.5 mt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-3.5 rounded-2xl border text-sm leading-relaxed ${m.role === "user"
                          ? "bg-primary border border-primary/30 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)] font-medium"
                          : "bg-card/40 backdrop-blur-3xl border border-border/40 text-text shadow-xl shadow-black/5"
                        }`}
                    >
                      <MessageContent content={m.content} role={m.role} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-card/40 backdrop-blur-3xl border border-border/40 shadow-xl shadow-black/5 px-4 py-3.5 rounded-2xl flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-border bg-background backdrop-blur-md flex-shrink-0">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this lesson, request examples, or say 'quiz me'..."
                  className="w-full bg-card border border-border rounded-2xl py-4 pl-5 pr-14 text-text placeholder-slate-500 focus:outline-none focus:border-primary/60 transition shadow-xl text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 disabled:bg-primary/10 disabled:text-primary/30 dark:disabled:bg-primary/5 dark:disabled:text-primary/20 p-2.5 rounded-xl transition shadow-lg cursor-pointer border border-primary/20 dark:border-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-600 mt-2">
                Tutor Agent has context of your active lesson &amp; current skill level
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

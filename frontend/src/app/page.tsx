"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, Brain, Network, Compass, Layers, Bot, Zap, Clock, Code, Activity, Search, ShieldCheck, LogOut, User, Key, LayoutDashboard, BookOpen, CheckCircle2 } from "lucide-react";
import { AIOrb } from "@/components/ui/ai-orb";
import { Typewriter } from "@/components/ui/typewriter";
import { InteractiveParticles } from "@/components/ui/interactive-particles";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

function FloatingPreview({ delay, className, title, content }: { delay: number, className: string, title: string, content: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: [0, -15, 0] }}
      transition={{ opacity: { duration: 1, delay }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay } }}
      className={`absolute ${className} z-20 glass-panel p-4 rounded-xl border border-border shadow-2xl backdrop-blur-2xl bg-card/60 w-64`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-danger" />
        <div className="w-2 h-2 rounded-full bg-warning" />
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-[10px] font-medium text-text-muted ml-2">{title}</span>
      </div>
      <div className="space-y-2">
        {content}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            localStorage.removeItem("token");
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.refresh();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-text selection:bg-primary/20 selection:text-primary transition-colors duration-300 relative" ref={containerRef}>
      <InteractiveParticles />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/favicon.png" alt="EduVerse AI" width={28} height={28} className="rounded-lg object-contain" />
            <span className="font-bold text-base sm:text-xl tracking-tight text-text">EduVerse AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-text transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Zap className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </button>
            )}

            {user ? (
              <>
                <Link href="/dashboard" className="hidden sm:flex text-sm font-medium text-text-muted hover:text-text transition-colors items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/quiz" className="hidden md:flex text-sm font-medium text-text-muted hover:text-text transition-colors items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Take Quiz
                </Link>
                <div className="relative group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer border-2 border-transparent group-hover:border-indigo-500/50 transition-all">
                    {user?.username?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-2 group-hover:translate-y-0 overflow-hidden z-50">
                    <Link href="/dashboard" className="flex sm:hidden items-center gap-2.5 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-border/50 transition">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-border/50 transition">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link href="/settings/change-password" className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-border/50 transition">
                      <Key className="w-4 h-4" /> Change Password
                    </Link>
                    <div className="h-px bg-border w-full"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left cursor-pointer">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-medium bg-text text-background hover:scale-105 px-4 sm:px-5 py-2 rounded-full transition-all shadow-md">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background AI Orb & Previews */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10" />
          <AIOrb />

          {/* Floating Previews Container — hidden on mobile to prevent overflow */}
          <div className="hidden md:block absolute inset-0 max-w-7xl mx-auto px-6 pointer-events-none">
            <FloatingPreview
              delay={0.5}
              className="absolute right-[5%] lg:right-[8%] top-[20%] z-10 pointer-events-auto"
              title="Planner Agent Active"
              content={
                <>
                  <div className="flex justify-between items-center text-xs mb-1"><span className="text-text font-medium">Python Basics</span> <span className="text-accent">100%</span></div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden"><div className="w-full h-full bg-accent" /></div>
                  <div className="flex justify-between items-center text-xs mt-3 mb-1"><span className="text-text font-medium">Data Structures</span> <span className="text-primary animate-pulse">In Progress</span></div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden"><div className="w-2/3 h-full bg-primary" /></div>
                </>
              }
            />

            <FloatingPreview
              delay={1.2}
              className="absolute right-[10%] lg:right-[4%] bottom-[20%] z-10 pointer-events-auto"
              title="Tutor Agent"
              content={
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-white" /></div>
                  <div className="bg-card border border-border p-2 rounded-lg rounded-tl-none text-[10px] text-text shadow-xl">
                    Yes, Big O notation describes the upper bound of complexity...
                  </div>
                </div>
              }
            />

            <FloatingPreview
              delay={2.1}
              className="absolute left-[5%] lg:left-[50%] top-[50%] z-10 pointer-events-auto hidden md:block"
              title="Analyzer Agent"
              content={
                <div className="flex gap-3 items-center">
                  <Activity className="w-8 h-8 text-emerald-500" />
                  <div className="space-y-1">
                    <div className="text-xs text-text font-bold">Concept Gap Detected</div>
                    <div className="text-[10px] text-text-muted">Generating targeted quiz...</div>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pointer-events-none">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-2xl pointer-events-none select-none"
          >
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] mb-6 text-text drop-shadow-md">
              <span className="text-primary drop-shadow-none">AGENTIC</span> AI SYSTEM<br />
              <Typewriter />
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-muted max-w-xl mb-10 leading-relaxed font-medium drop-shadow-sm bg-background/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 rounded-2xl md:rounded-none">
              Not a traditional LMS. EduVerse AI orchestrates specialized autonomous agents to generate roadmaps, tutor you, test your skills, and adapt your curriculum in real-time.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 font-medium px-8 py-4 rounded-full transition-all hover:scale-[1.02] shadow-xl shadow-primary/20">
                Start Your Journey <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 bg-card/80 hover:bg-card border border-border font-medium px-8 py-4 rounded-full transition-all backdrop-blur-md">
                How it works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Massive Agent Showcase */}
      <section className="py-32 relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-card/5 backdrop-blur-sm border-y border-border/20 -z-10" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-32">

          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Meet Your AI Team</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Four specialized, highly-capable agents working synchronously.</p>
          </div>

          {[
            {
              title: "Planner Agent", desc: "Architects your learning roadmap. Adapts dynamically based on your quiz results and learning velocity.",
              icon: <Compass className="w-8 h-8 text-primary" />, stat: "Generates custom roadmaps in < 5s", color: "text-primary", bg: "bg-primary/10 border-primary/20",
              mock: (
                <div className="w-full h-full bg-card/80 border border-border rounded-2xl shadow-2xl p-6 flex flex-col justify-between backdrop-blur-md">
                  <div className="space-y-4">
                    <div className="h-6 w-1/3 bg-slate-700/30 rounded-md mb-2" />
                    <div className="p-4 border border-primary/50 rounded-xl flex justify-between items-center bg-primary/5 shadow-sm">
                      <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-primary animate-pulse" /><span className="text-sm font-bold text-primary">Python Basics</span></div>
                      <span className="text-xs text-primary font-bold">Active Node</span>
                    </div>
                    <div className="p-4 border border-border rounded-xl flex justify-between items-center bg-card shadow-sm">
                      <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-emerald-500" /><span className="text-sm font-medium">Data Structures</span></div>
                      <span className="text-xs text-emerald-500 font-medium">Completed</span>
                    </div>
                    <div className="p-4 border border-border rounded-xl flex justify-between items-center bg-card shadow-sm">
                      <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-emerald-500" /><span className="text-sm font-medium">Algorithms</span></div>
                      <span className="text-xs text-emerald-500 font-medium">Completed</span>
                    </div>
                    <div className="p-4 border border-border rounded-xl flex justify-between items-center opacity-60 bg-card">
                      <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-slate-700" /><span className="text-sm font-medium">FastAPI & Routing</span></div>
                      <span className="text-xs text-text-muted">Locked</span>
                    </div>
                    {/* <div className="p-4 border border-border rounded-xl flex justify-between items-center opacity-60 bg-card">
                      <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-slate-700" /><span className="text-sm font-medium">Deployment</span></div>
                      <span className="text-xs text-text-muted">Locked</span>
                    </div> */}
                  </div>
                </div>
              )
            },
            {
              title: "Tutor Agent", desc: "A conversational guide that breaks down complex topics, answers questions, and provides live coding examples.",
              icon: <Bot className="w-8 h-8 text-accent" />, stat: "Context-aware infinite memory", color: "text-accent", bg: "bg-accent/10 border-accent/20",
              mock: (
                <div className="w-full h-full bg-card/80 border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-3 backdrop-blur-md overflow-hidden">
                  <div className="flex gap-3 items-center border-b border-border pb-3 mb-2">
                    <Bot className="w-5 h-5 text-accent" />
                    <span className="text-sm font-bold text-text">Live Study Session</span>
                  </div>
                  <div className="w-3/4 p-3 rounded-xl rounded-tl-none bg-card border border-border text-text-muted text-sm self-start shadow-sm">Hello! I am your AI Tutor. What are we studying today?</div>
                  <div className="w-3/4 p-3 rounded-xl rounded-tr-none bg-accent/20 text-text text-sm self-end shadow-sm">Can you explain Big O notation?</div>
                  <div className="w-3/4 p-3 rounded-xl rounded-tl-none bg-card border border-border text-text-muted text-sm self-start shadow-sm">Sure! Big O notation describes the upper bound of complexity...</div>
                  <div className="w-3/4 p-3 rounded-xl rounded-tr-none bg-accent/20 text-text text-sm self-end shadow-sm">How does binary search work?</div>
                  {/* <div className="w-3/4 p-3 rounded-xl rounded-tl-none bg-card border border-border text-text-muted text-sm self-start shadow-sm">It divides the search interval in half. Let me show you a quick example...</div> */}
                </div>
              )
            },
            {
              title: "Quiz Agent", desc: "Evaluates your knowledge. Generates hyper-specific questions based on the exact material you just studied.",
              icon: <Activity className="w-8 h-8 text-warning" />, stat: "Real-time proficiency scoring", color: "text-warning", bg: "bg-warning/10 border-warning/20",
              mock: (
                <div className="w-full h-full bg-card/80 border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-6 w-1/2 bg-warning/20 rounded-md" />
                      <span className="text-xs font-bold text-warning bg-warning/10 px-3 py-1 rounded-full">Question 4 of 10</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 border border-border rounded-lg bg-card hover:bg-border/30 transition-colors text-sm text-text-muted flex items-center gap-3"><div className="w-5 h-5 rounded border border-border flex items-center justify-center text-[10px]">A</div> O(n) Time Complexity</div>
                      <div className="p-3 border border-warning text-warning bg-warning/5 rounded-lg text-sm font-bold flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded border border-warning flex items-center justify-center text-[10px] bg-warning text-background">B</div> O(log n) Time Complexity</div> <CheckCircle2 className="w-4 h-4" /></div>
                      <div className="p-3 border border-border rounded-lg bg-card hover:bg-border/30 transition-colors text-sm text-text-muted flex items-center gap-3"><div className="w-5 h-5 rounded border border-border flex items-center justify-center text-[10px]">C</div> O(1) Time Complexity</div>
                      <div className="p-3 border border-border rounded-lg bg-card hover:bg-border/30 transition-colors text-sm text-text-muted flex items-center gap-3"><div className="w-5 h-5 rounded border border-border flex items-center justify-center text-[10px]">D</div> O(n log n) Time Complexity</div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center pt-4 border-t border-border">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(dot => (
                        <div key={dot} className={`w-2 h-2 rounded-full ${dot <= 4 ? "bg-warning" : "bg-border"}`} />
                      ))}
                    </div>
                    <div className="text-xs text-text-muted">Score: 100%</div>
                  </div>
                </div>
              )
            },
            {
              title: "Research Agent", desc: "Crawls the web to find perfect, up-to-date study materials, documentation, and videos for your exact milestone.",
              icon: <Search className="w-8 h-8 text-danger" />, stat: "Live internet access & scraping", color: "text-danger", bg: "bg-danger/10 border-danger/20",
              mock: (
                <div className="w-full h-full bg-card/80 border border-border rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-4 backdrop-blur-md overflow-hidden">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-border rounded-lg p-3 bg-card space-y-2 hover:border-danger/50 transition-colors">
                      <div className="w-full h-12 bg-danger/10 rounded flex items-center justify-center">
                        <Search className="w-5 h-5 text-danger/40" />
                      </div>
                      <div className="h-2 w-3/4 bg-slate-700/30 rounded" />
                      <div className="h-2 w-1/2 bg-slate-700/20 rounded" />
                    </div>
                  ))}
                </div>
              )
            }
          ].map((agent, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}
            >
              {/* Text Side */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: i % 2 === 0 ? -50 : 50 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="flex-1 space-y-6"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${agent.bg}`}>
                  {agent.icon}
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold">{agent.title}</h3>
                <p className="text-text-muted text-lg leading-relaxed">{agent.desc}</p>
                <div className="flex items-center gap-2 text-sm font-medium pt-2">
                  <ShieldCheck className={`w-5 h-5 ${agent.color}`} />
                  <span className="text-text">{agent.stat}</span>
                </div>
              </motion.div>

              {/* Preview Side */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: i % 2 === 0 ? 100 : -100, scale: 0.9 },
                  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut", delay: 0.2 } }
                }}
                className="flex-1 w-full h-[350px] relative group"
              >
                {/* Decorative blob behind preview */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 ${agent.bg.split(' ')[0]} blur-[80px] rounded-full -z-10 group-hover:scale-110 transition-transform duration-700`} />
                {agent.mock}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Timeline (How it works) */}
      <section id="how-it-works" className="py-32 max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8">The Learning Journey</h2>
            <p className="text-text-muted mb-12 text-lg leading-relaxed">A dynamic timeline that evolves as you progress. Your curriculum is never static. Complete a node, and the Planner Agent recalibrates the next steps.</p>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
              {[
                "Python Fundamentals",
                "Data Structures",
                "Machine Learning",
                "Deep Learning",
                "LLMs & AI Agents"
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-border z-10 relative">
                    {i < 2 ? (
                      <div className="w-3 h-3 bg-accent rounded-full" />
                    ) : i === 2 ? (
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 bg-border rounded-full" />
                    )}
                  </div>

                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-bold text-lg ${i === 2 ? 'text-primary' : 'text-text'}`}>{step}</h4>
                    </div>
                    <p className="text-text-muted text-sm">
                      {i < 2 ? "Module Completed successfully. Mastery confirmed by Quiz Agent." : i === 2 ? "Currently studying with Tutor Agent. Live generation..." : "Locked. Depends on current module mastery."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <motion.div
              style={{ y }}
              className="glass-panel p-8 rounded-3xl border border-border shadow-2xl bg-card/80 backdrop-blur-xl relative z-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Image src="/favicon.png" alt="EduVerse" width={24} height={24} className="rounded object-contain" />
                <span className="font-bold text-lg tracking-tight">EduVerse AI</span>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-text">Quiz Score: 95%</div>
                    <div className="text-xs text-text-muted">Mastery threshold reached</div>
                  </div>
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-text">Planner Active</div>
                    <div className="text-xs text-text-muted">Generating next node: Machine Learning</div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary text-sm font-medium animate-pulse">
                  Unlocking module materials...
                </div>
              </div>
            </motion.div>

            {/* Decorative background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] rounded-full -z-10" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 border-t border-border" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-5xl md:text-6xl font-extrabold mb-8 tracking-tight">Ready to accelerate your learning?</h2>
            <p className="text-text-muted text-xl mb-12 max-w-2xl mx-auto">Join EduVerse AI today and let our agents architect your perfect, personalized curriculum.</p>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-text text-background hover:scale-105 font-bold px-10 py-5 rounded-full transition-all shadow-2xl">
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-sm text-text-muted text-center bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <p>© 2026 EduVerse AI. Intelligence in Education.</p>
          </div>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-text transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-text transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

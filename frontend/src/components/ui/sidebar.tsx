"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  GraduationCap, LayoutDashboard, Compass, MessageSquare, 
  BookOpen, BarChart2, User, Settings, LogOut, Milestone,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Shield, Moon, Sun
} from "lucide-react";
import { useTheme } from "next-themes";

interface SidebarProps {
  /** When true the sidebar renders as a mobile drawer (no m-4, full height) */
  mobileMode?: boolean;
  /** Called when a nav link is clicked in mobileMode to close the drawer */
  onClose?: () => void;
}

export default function Sidebar({ mobileMode = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [roadmapOpen, setRoadmapOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [devOpen, setDevOpen] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
    setIsCollapsed(collapsed);
    
    // Auto-open sections if current path is a sub-path
    if (pathname.startsWith("/roadmap/milestone")) {
      setRoadmapOpen(true);
    }
    if (pathname.startsWith("/settings")) {
      setSettingsOpen(true);
    }
    if (pathname.startsWith("/dev")) {
      setDevOpen(true);
    }

    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [meRes, roadmapRes] = await Promise.all([
          fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/roadmap/active", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
        }
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          setRoadmap(roadmapData);
        }
      } catch (err) {
        console.error("Sidebar data load error:", err);
      }
    };
    fetchUserData();
  }, [pathname]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const handleSectionClick = (section: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
    }
    if (section === "roadmap") setRoadmapOpen(!roadmapOpen);
    if (section === "settings") setSettingsOpen(!settingsOpen);
    if (section === "dev") setDevOpen(!devOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebarScroll");
    if (savedScroll && sidebarRef.current) {
      sidebarRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("sidebarScroll", String(e.currentTarget.scrollTop));
  };

  const isDevUser = user?.email === "ripjaws@gmail.com";

  const handleNavClick = () => {
    if (mobileMode && onClose) onClose();
  };

  return (
    <aside 
      ref={sidebarRef}
      onScroll={handleScroll}
      className={`${
        mobileMode
          ? "w-72 h-full rounded-none m-0 sticky-none"
          : isCollapsed ? "w-20" : "w-72"
      } border border-border/40 bg-card/40 backdrop-blur-3xl flex flex-col justify-between ${
        mobileMode ? "h-full" : "h-[calc(100vh-2rem)] m-4 rounded-[2rem] sticky top-4"
      } transition-all duration-300 px-4 py-6 z-0 overflow-y-auto shadow-2xl shadow-black/5`}
    >
      <div className="space-y-6">
        {/* Logo and Collapse Toggle */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-2`}>
          <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition cursor-pointer">
            {isCollapsed ? (
              <Image src="/favicon.png" alt="EduVerse" width={32} height={32} className="rounded-lg object-contain" />
            ) : (
              <div className="flex items-center justify-center w-full gap-2">
                <Image src="/favicon.png" alt="EduVerse AI" width={32} height={32} className="object-contain" />
                <span className="font-bold text-lg text-text tracking-tight">EduVerse AI</span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button 
              onClick={toggleCollapse} 
              className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text transition"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center border-b border-border pb-4">
            <button 
              onClick={toggleCollapse} 
              className="p-1.5 hover:bg-card rounded-lg text-text-muted hover:text-text transition"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname === "/dashboard"
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <LayoutDashboard className="w-5 h-5" />
              {!isCollapsed && <span>Dashboard</span>}
            </div>
          </Link>

          {/* Learning Roadmap Collapsible */}
          <div>
            <button
              onClick={() => handleSectionClick("roadmap")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
                pathname.startsWith("/roadmap")
                  ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                  : "text-text-muted hover:text-text hover:bg-card"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Milestone className="w-5 h-5" />
                {!isCollapsed && <span>Learning Roadmap</span>}
              </div>
              {!isCollapsed && (
                roadmapOpen
                  ? <ChevronUp className={`w-4 h-4 ${pathname.startsWith("/roadmap") ? "text-white" : "text-text-muted"}`} />
                  : <ChevronDown className={`w-4 h-4 ${pathname.startsWith("/roadmap") ? "text-white" : "text-text-muted"}`} />
              )}
            </button>

             {!isCollapsed && roadmapOpen && (
              <div className="ml-9 mt-1 space-y-1 border-l border-border pl-3">
                {roadmap?.milestones?.map((milestone: any, idx: number) => {
                  const href = `/roadmap/milestone/${idx + 1}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={idx}
                      href={href}
                      scroll={false}
                      onClick={handleNavClick}
                      className={`block py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/10"
                          : "text-text-muted hover:text-text hover:bg-card"
                      }`}
                    >
                      Milestone {idx + 1}
                    </Link>
                  );
                }) || (
                  <Link
                    href="/roadmap"
                    scroll={false}
                    className="block py-1.5 px-3 text-xs font-medium text-text-muted hover:text-text-muted"
                  >
                    View Roadmap
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* AI Tutor */}
          <Link
            href="/tutor"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname === "/tutor"
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5" />
              {!isCollapsed && <span>AI Tutor</span>}
            </div>
          </Link>

          {/* Quiz Center */}
          <Link
            href="/quiz"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname.startsWith("/quiz")
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <BookOpen className="w-5 h-5" />
              {!isCollapsed && <span>Quiz Center</span>}
            </div>
          </Link>

          {/* Resource Explorer */}
          <Link
            href="/resources"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname === "/resources"
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Compass className="w-5 h-5" />
              {!isCollapsed && <span>Resource Explorer</span>}
            </div>
          </Link>

          {/* Progress Analytics */}
          <Link
            href="/analytics"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname === "/analytics"
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <BarChart2 className="w-5 h-5" />
              {!isCollapsed && <span>Progress Analytics</span>}
            </div>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            onClick={handleNavClick}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
              pathname === "/profile"
                ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                : "text-text-muted hover:text-text hover:bg-card"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <User className="w-5 h-5" />
              {!isCollapsed && <span>Profile</span>}
            </div>
          </Link>

          {/* Settings Collapsible */}
          <div>
            <button
              onClick={() => handleSectionClick("settings")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
                pathname.startsWith("/settings")
                  ? "bg-primary text-primary-foreground text-white shadow-lg shadow-primary/10"
                  : "text-text-muted hover:text-text hover:bg-card"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Settings className="w-5 h-5" />
                {!isCollapsed && <span>Settings</span>}
              </div>
              {!isCollapsed && (
                settingsOpen
                  ? <ChevronUp className={`w-4 h-4 ${pathname.startsWith("/settings") ? "text-white" : "text-text-muted"}`} />
                  : <ChevronDown className={`w-4 h-4 ${pathname.startsWith("/settings") ? "text-white" : "text-text-muted"}`} />
              )}
            </button>

             {!isCollapsed && settingsOpen && (
              <div className="ml-9 mt-1 space-y-1 border-l border-border pl-3">
                {[
                  { name: "General", tab: "general" },
                  { name: "Notifications", tab: "notifications" },
                  { name: "Security", tab: "security" },
                  { name: "Change Password", tab: "change-password" },
                  { name: "Data Export", tab: "data-export" }
                ].map((s) => {
                  const href = `/settings/${s.tab}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={s.tab}
                      href={href}
                      scroll={false}
                      onClick={handleNavClick}
                      className={`block py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/10"
                          : "text-text-muted hover:text-text hover:bg-card"
                      }`}
                    >
                      {s.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Developer Menu Collapsible (Only ripjaws@gmail.com) */}
          {isDevUser && (
            <div>
              <button
                onClick={() => handleSectionClick("dev")}
                className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl font-medium text-sm transition ${
                  pathname.startsWith("/dev")
                    ? "bg-danger text-white shadow-lg shadow-danger/10"
                    : "text-text-muted hover:text-danger hover:bg-danger/10"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Shield className={`w-5 h-5 ${pathname.startsWith("/dev") ? "text-white" : "text-red-500"}`} />
                  {!isCollapsed && <span className={`font-semibold ${pathname.startsWith("/dev") ? "text-white" : "text-red-400"}`}>Developer Space</span>}
                </div>
                {!isCollapsed && (
                  devOpen
                    ? <ChevronUp className={`w-4 h-4 ${pathname.startsWith("/dev") ? "text-white" : "text-red-700"}`} />
                    : <ChevronDown className={`w-4 h-4 ${pathname.startsWith("/dev") ? "text-white" : "text-red-700"}`} />
                )}
              </button>

              {!isCollapsed && devOpen && (
                <div className="ml-9 mt-1 space-y-1 border-l border-red-900/40 pl-3">
                  <Link
                    href="/dev/users"
                    onClick={handleNavClick}
                    className={`block py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                      pathname === "/dev/users"
                        ? "text-danger bg-danger/15"
                        : "text-text-muted hover:text-text hover:bg-card"
                    }`}
                  >
                    User Management
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Theme Toggle & Logout button */}
      <div className="mt-auto pt-4 border-t border-border space-y-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3.5"} px-4 py-3 rounded-xl font-medium text-sm text-text-muted hover:text-text hover:bg-card/50 transition`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            {!isCollapsed && <span className="truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3.5"} px-4 py-3 rounded-xl font-medium text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

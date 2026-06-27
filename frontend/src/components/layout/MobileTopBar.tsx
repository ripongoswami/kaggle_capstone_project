"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tutor": "AI Tutor",
  "/quiz": "Quiz Center",
  "/resources": "Resource Explorer",
  "/analytics": "Progress Analytics",
  "/profile": "Profile",
  "/settings/general": "Settings",
  "/settings/notifications": "Settings",
  "/settings/security": "Settings",
  "/settings/change-password": "Settings",
  "/settings/data-export": "Settings",
  "/dev/users": "Developer Space",
};

function getTitle(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/roadmap/milestone")) return "Learning Roadmap";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/dev")) return "Developer Space";
  return "EduVerse AI";
}

interface MobileTopBarProps {
  onMenuClick: () => void;
}

export default function MobileTopBar({ onMenuClick }: MobileTopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-card transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <Image src="/favicon.png" alt="EduVerse" width={24} height={24} className="rounded-md object-contain" />
        <span className="font-bold text-sm text-text tracking-tight">{getTitle(pathname)}</span>
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-card transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      )}
    </header>
  );
}

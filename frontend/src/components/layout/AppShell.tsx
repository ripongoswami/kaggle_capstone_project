"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileTopBar from "@/components/layout/MobileTopBar";

interface AppShellProps {
  children: React.ReactNode;
  /**
   * Classes applied to the <main> element.
   * Defaults to a standard scrollable padded column.
   * Pass a full set of classes to override (e.g. for split-screen pages).
   */
  mainClassName?: string;
}

export default function AppShell({ children, mainClassName = "overflow-y-auto p-4 sm:p-6 lg:p-6 xl:p-10" }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="h-screen bg-background text-text flex relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar mobileMode onClose={closeDrawer} />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Mobile top bar — only visible below lg */}
        <MobileTopBar onMenuClick={openDrawer} />

        <main
          className={`flex-1 min-h-0 z-10 ${mainClassName}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

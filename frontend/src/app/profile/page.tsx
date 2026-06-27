"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { User, Mail, Calendar, Compass, Shield } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);



  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-10 space-y-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text">User Profile</h1>
            <p className="text-text-muted text-sm mt-1">Manage credentials and learning goals</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <User className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
        ) : (
        <>
        {/* User Card Wrapper - Horizontal centering */}
        <div className="flex justify-center items-center flex-1 w-full">
          <div className="w-full max-w-2xl space-y-6">
            <div className="glass-panel p-8 rounded-2xl border border-border flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary text-white border border-indigo-500/20 flex items-center justify-center text-3xl font-bold">
                {user?.username?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-text">{user?.username || "Student"}</h2>
                <p className="text-text-muted text-sm">{user?.email || "student@eduverse.ai"}</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-border space-y-6">
              <h3 className="font-bold text-lg text-text">Learning Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-text-muted text-xs block">Active Goal</span>
                    <span className="font-semibold text-sm text-text">{user?.goal || "Learn AI Agents"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-text-muted text-xs block">Skill Level</span>
                    <span className="font-semibold text-sm text-text">{user?.skill_level || "Beginner"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-text-muted text-xs block">Daily study commitment</span>
                    <span className="font-semibold text-sm text-text">{user?.daily_study_time || 60} Minutes</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-text-muted text-xs block">Joined</span>
                    <span className="font-semibold text-sm text-text">June 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </AppShell>
  );
}
export type ProfileType = typeof ProfilePage;

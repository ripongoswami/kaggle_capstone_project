"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Settings as SettingsIcon, Eye, EyeOff, Bell, Shield, Sparkles, User as UserIcon, Database, Check, CheckCircle2, Loader2, Lock } from "lucide-react";

export default function SettingsTab() {
  const params = useParams();
  const router = useRouter();
  const tab = (params.tab as string) || "general";

  useEffect(() => {
    if (tab === "appearance") {
      router.replace("/settings/general");
    }
  }, [tab, router]);

  const [theme, setTheme] = useState("Dark");
  const [reminders, setReminders] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // General settings state
  const [goal, setGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [studyTime, setStudyTime] = useState("60");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  // Custom API Keys
  const [geminiKey, setGeminiKey] = useState("");
  const [tavilyKey, setTavilyKey] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldVerified, setOldVerified] = useState(false);
  const [verifyingOld, setVerifyingOld] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGoal(data.goal || "");
          setSkillLevel(data.skill_level || "Beginner");
          setStudyTime(data.daily_study_time?.toString() || "60");
          setTargetDate(data.target_date || "");
          setGeminiKey(data.gemini_api_key || "");
          setTavilyKey(data.tavily_api_key || "");
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          goal,
          skill_level: skillLevel,
          daily_study_time: parseInt(studyTime),
          target_date: targetDate || null,
          gemini_api_key: geminiKey || null,
          tavily_api_key: tavilyKey || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update profile settings.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestKeys = async () => {
    setTesting(true);
    setTestResult(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/auth/test-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          gemini_api_key: geminiKey || null,
          tavily_api_key: tavilyKey || null
        })
      });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
      } else {
        setTestResult({ error: "Failed to perform verification." });
      }
    } catch (err: any) {
      setTestResult({ error: err.message || "Network error" });
    } finally {
      setTesting(false);
    }
  };

  const handleExportData = () => {
    const backupData = {
      learningGoal: goal,
      skillLevel,
      dailyStudyMinutes: studyTime,
      theme,
      reminders,
      exportedAt: new Date().toISOString(),
      platform: "EduVerse AI OS"
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eduverse-settings-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { name: "General", tab: "general", icon: UserIcon },
    { name: "Notifications", tab: "notifications", icon: Bell },
    { name: "Security", tab: "security", icon: Shield },
    { name: "Change Password", tab: "change-password", icon: Lock },
    { name: "Data Export", tab: "data-export", icon: Database },
  ];

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text">System Settings</h1>
            <p className="text-text-muted text-sm mt-1">Configure layout, alert settings, goals, and credentials</p>
          </div>
        </div>

        {/* Saved Toast Alert */}
        {saved && (
          <div className="fixed bottom-8 right-8 bg-emerald-600 border border-emerald-500 text-text px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-slide-in">
            <Check className="w-5 h-5" />
            <span className="font-semibold text-sm">Settings updated successfully!</span>
          </div>
        )}

        <div className="flex justify-center w-full">
          {/* Active Tab Panel */}
          <div className="max-w-3xl w-full">
            {tab === "general" && (
              <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-bold text-lg text-text">General Parameters</h3>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Study Goal</label>
                  <input
                    type="text"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Skill Level</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-indigo-500/80 transition"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Daily Study (Min)</label>
                    <select
                      value={studyTime}
                      onChange={(e) => setStudyTime(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-indigo-500/80 transition"
                    >
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes</option>
                      <option value="90">90 Minutes</option>
                      <option value="120">120 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-primary/10 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Regenerating Ecosystem...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            )}


            {tab === "notifications" && (
              <div className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-bold text-lg text-text">Alert Configurations</h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-text block">Study Reminders</span>
                      <span className="text-xs text-text-muted">Get notified when it is time to complete daily goals</span>
                    </div>
                    <button
                      onClick={() => setReminders(!reminders)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                        reminders ? "bg-primary text-primary-foreground" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                          reminders ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-6">
                    <div>
                      <span className="font-semibold text-sm text-text block">Weekly Digests</span>
                      <span className="text-xs text-text-muted">Receive performance summaries over email</span>
                    </div>
                    <button
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                        emailAlerts ? "bg-primary text-primary-foreground" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                          emailAlerts ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div className="space-y-6">
                <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                  <h3 className="font-bold text-lg text-text">Custom API Credentials</h3>
                  <p className="text-slate-450 text-xs leading-relaxed">
                    By default, the platform uses shared back-end API keys. Insert your own custom keys to enjoy higher quotas and prevent service rate-limiting.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Gemini API Key</label>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text placeholder-slate-650 focus:outline-none focus:border-indigo-500/80 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tavily Search API Key</label>
                      <input
                        type="password"
                        value={tavilyKey}
                        onChange={(e) => setTavilyKey(e.target.value)}
                        placeholder="tvly-..."
                        className="w-full bg-card border border-border rounded-xl py-3 px-4 text-text placeholder-slate-650 focus:outline-none focus:border-indigo-500/80 transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-indigo-500 disabled:opacity-50 font-semibold px-6 py-3 rounded-xl transition shadow-lg cursor-pointer animate-pulse-once"
                    >
                      Save API Keys
                    </button>
                    <button
                      type="button"
                      onClick={handleTestKeys}
                      disabled={testing}
                      className="bg-card/50 border border-slate-850 hover:bg-card disabled:opacity-50 text-slate-350 font-semibold px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      {testing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
                      Test Connection
                    </button>
                  </div>
                </form>

                {testResult && (
                  <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
                    <h4 className="font-bold text-sm text-text">Connection Verification Results</h4>
                    {testResult.error ? (
                      <p className="text-xs text-red-400">{testResult.error}</p>
                    ) : (
                      <div className="text-xs space-y-2.5">
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span>Gemini API Status:</span>
                          <span className={testResult.gemini === "Valid" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {testResult.gemini}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tavily Search API Status:</span>
                          <span className={testResult.tavily === "Valid" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {testResult.tavily}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "change-password" && (
              <div className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-bold text-lg text-text">Change Account Password</h3>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Step 1: Old Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Old Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                      <input
                        type={showOldPassword ? "text" : "password"}
                        required
                        disabled={oldVerified}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter old password"
                        className="w-full bg-card border border-border rounded-xl py-3 pl-11 pr-32 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition text-sm disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-24 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted transition focus:outline-none cursor-pointer"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {!oldVerified && (
                        <button
                          type="button"
                          disabled={verifyingOld || !oldPassword}
                          onClick={async () => {
                            setVerifyingOld(true);
                            setError("");
                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch("/api/auth/verify-password", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify({ password: oldPassword })
                              });
                              if (res.ok) {
                                setOldVerified(true);
                              } else {
                                const errData = await res.json();
                                setError(errData.detail || "Old password verification failed.");
                              }
                            } catch (err: any) {
                              setError(err.message || "Verification request failed.");
                            } finally {
                              setVerifyingOld(false);
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {verifyingOld ? "Verifying..." : "Verify"}
                        </button>
                      )}
                      {oldVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs flex items-center gap-1">
                          <span>Verified</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: New Password & Confirm (only available after verification) */}
                  <div className={`space-y-4 transition-all duration-300 ${oldVerified ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none"}`}>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          disabled={!oldVerified}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full bg-card border border-border rounded-xl py-3 pl-11 pr-12 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted transition focus:outline-none cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          disabled={!oldVerified}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full bg-card border border-border rounded-xl py-3 pl-11 pr-12 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted transition focus:outline-none cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!oldVerified || !newPassword || newPassword !== confirmPassword || saving}
                      onClick={async () => {
                        setSaving(true);
                        setError("");
                        const token = localStorage.getItem("token");
                        try {
                          const res = await fetch("/api/auth/change-password", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              old_password: oldPassword,
                              new_password: newPassword
                            })
                          });
                          if (res.ok) {
                            setSaved(true);
                            setOldPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setOldVerified(false);
                            setTimeout(() => setSaved(false), 2000);
                          } else {
                            const errData = await res.json();
                            setError(errData.detail || "Failed to update password.");
                          }
                        } catch (err: any) {
                          setError(err.message || "Request failed.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="bg-primary hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Password"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "data-export" && (
              <div className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-bold text-lg text-text font-sans">Backup & Data Portability</h3>
                
                <div className="space-y-4">
                  <p className="text-text-muted text-xs leading-relaxed">
                    Export your custom roadmap milestones, completed quiz metrics, study hours, and configuration preferences to a structured backup JSON file.
                  </p>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleExportData}
                      type="button"
                      className="bg-primary text-primary-foreground hover:bg-indigo-500 text-xs font-semibold px-5 py-3 rounded-xl transition cursor-pointer"
                    >
                      Export Study Data (JSON)
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/";
                      }}
                      type="button"
                      className="bg-card border border-border hover:bg-card/80 text-text text-xs font-semibold px-5 py-3 rounded-xl transition cursor-pointer"
                    >
                      Clear Cache & Log Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
  );
}

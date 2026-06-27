"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { 
  Shield, UserPlus, Edit, Trash2, Search, Check, X, Loader2, KeyRound, AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModalPortal from "@/components/ui/modal-portal";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  goal: string | null;
  skill_level: string | null;
  daily_study_time: number;
  target_date: string | null;
  gemini_api_key: string | null;
  tavily_api_key: string | null;
  created_at: string;
}

export default function DevConsole() {
  const params = useParams();
  const router = useRouter();
  const activeTab = (params.tab as string) || "users";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    goal: "",
    skill_level: "Beginner",
    daily_study_time: 60,
    target_date: "",
    gemini_api_key: "",
    tavily_api_key: ""
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Check auth and permissions
  useEffect(() => {
    const fetchProfileAndUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        // 1. Get Me
        const profileRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!profileRes.ok) {
          router.push("/login");
          return;
        }
        const profile = await profileRes.json();
        setCurrentUser(profile);

        if (profile.email !== "ripjaws@gmail.com") {
          // Access Denied
          setLoading(false);
          return;
        }

        // 2. Get Users
        const usersRes = await fetch("/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const list = await usersRes.json();
          setUsers(list);
        } else {
          setError("Failed to fetch user list.");
        }
      } catch (e) {
        console.error(e);
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndUsers();
  }, [router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          goal: formData.goal || null,
          skill_level: formData.skill_level,
          daily_study_time: Number(formData.daily_study_time),
          target_date: formData.target_date || null,
          gemini_api_key: formData.gemini_api_key || null,
          tavily_api_key: formData.tavily_api_key || null
        })
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [...prev, newUser]);
        setIsAddModalOpen(false);
        showToast(`User ${newUser.username} created successfully!`);
        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
          goal: "",
          skill_level: "Beginner",
          daily_study_time: 60,
          target_date: "",
          gemini_api_key: "",
          tavily_api_key: ""
        });
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create user.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/auth/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password || null, // Optional password reset
          goal: formData.goal || null,
          skill_level: formData.skill_level,
          daily_study_time: Number(formData.daily_study_time),
          target_date: formData.target_date || null,
          gemini_api_key: formData.gemini_api_key || null,
          tavily_api_key: formData.tavily_api_key || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setIsEditModalOpen(false);
        showToast(`User ${updated.username} updated successfully!`);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to update user.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/auth/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setIsDeleteModalOpen(false);
        showToast(`User deleted successfully!`);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to delete user.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: UserRecord) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "", // Leave blank unless changing
      goal: user.goal || "",
      skill_level: user.skill_level || "Beginner",
      daily_study_time: user.daily_study_time,
      target_date: user.target_date || "",
      gemini_api_key: user.gemini_api_key || "",
      tavily_api_key: user.tavily_api_key || ""
    });
    setError("");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: UserRecord) => {
    setSelectedUser(user);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.goal && u.goal.toLowerCase().includes(q))
    );
  });



  // Access check
  if (!currentUser || currentUser.email !== "ripjaws@gmail.com") {
    return (
      <div className="min-h-screen bg-background text-text flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-text">Developer Space Access Denied</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            This workspace contains administrative configurations restricted to authorization holders. Your user profile does not possess necessary capabilities.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-card border border-border hover:bg-slate-800 text-slate-350 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-10 space-y-6">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <span className="text-text-muted text-sm">Validating admin credentials...</span>
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-500" />
              Developer Workspace
            </h1>
            <p className="text-text-muted text-sm mt-1">Platform administration and global user account workspace</p>
          </div>

          <button
            onClick={() => {
              setFormData({
                username: "",
                email: "",
                password: "",
                goal: "",
                skill_level: "Beginner",
                daily_study_time: 60,
                target_date: "",
                gemini_api_key: "",
                tavily_api_key: ""
              });
              setError("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-red-650 hover:bg-red-600 text-text text-sm font-semibold rounded-xl transition shadow-lg shadow-red-950/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add User Account
          </button>
        </div>

        {/* Saved Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 bg-red-950 border border-red-800 text-red-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-slide-in">
            <Check className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
        )}

        {/* Filters and search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search user profiles by username, email, or goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-3 pl-11 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition text-sm"
            />
          </div>
          <div className="text-xs text-text-muted ml-auto font-medium">
            Displaying {filteredUsers.length} of {users.length} accounts
          </div>
        </div>

        {/* Users list table */}
        <div className="glass-panel border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/50 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="py-4 px-5">User ID</th>
                  <th className="py-4 px-5">Profile</th>
                  <th className="py-4 px-5">Active Goal</th>
                  <th className="py-4 px-5">Level & Study</th>
                  <th className="py-4 px-5">Custom Keys</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/30 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-text-muted">
                      No user accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-card transition-colors">
                      <td className="py-4 px-5 font-mono text-text-muted text-xs">#{u.id}</td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-text">{u.username}</div>
                        <div className="text-xs text-text-muted">{u.email}</div>
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <div className="truncate text-text-muted font-medium" title={u.goal || "None"}>
                          {u.goal || <span className="text-slate-600 italic">None Set</span>}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-border bg-card text-text-muted`}>
                          {u.skill_level || "Beginner"}
                        </span>
                        <span className="text-xs text-text-muted ml-2 font-mono">{u.daily_study_time}m / day</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2">
                          {u.gemini_api_key ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                              <KeyRound className="w-3 h-3" /> Gemini
                            </span>
                          ) : null}
                          {u.tavily_api_key ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400">
                              <KeyRound className="w-3 h-3" /> Tavily
                            </span>
                          ) : null}
                          {!u.gemini_api_key && !u.tavily_api_key ? (
                            <span className="text-xs text-slate-600 font-mono">Shared Keys</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 bg-card hover:bg-indigo-950/30 text-text-muted hover:text-primary border border-border rounded-lg transition cursor-pointer"
                          title="Edit profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(u);
                          }}
                          disabled={u.id === currentUser.id}
                          className="p-2 bg-card hover:bg-red-950/30 text-text-muted hover:text-red-400 border border-border rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === currentUser.id ? "Cannot delete yourself" : "Delete user"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD USER MODAL */}
        <AnimatePresence>
          {isAddModalOpen && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#0b0d19] border border-border max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-red-500" /> Add Administrative Account
                  </h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 text-text-muted hover:text-slate-350 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="p-6 overflow-y-auto space-y-4 flex-1">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Learning Goal</label>
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack Web Development"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Skill Level</label>
                      <select
                        value={formData.skill_level}
                        onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Daily Study (Min)</label>
                      <select
                        value={formData.daily_study_time.toString()}
                        onChange={(e) => setFormData({ ...formData, daily_study_time: Number(e.target.value) })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      >
                        <option value="30">30 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                        <option value="120">120 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Target Date</label>
                    <input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="border-t border-slate-850/60 pt-4 space-y-4">
                    <h4 className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4.5 h-4.5 text-red-500" /> Custom API Keys (Optional)
                    </h4>
                    <div className="space-y-2.5">
                      <input
                        type="password"
                        placeholder="Gemini API Key"
                        value={formData.gemini_api_key}
                        onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <input
                        type="password"
                        placeholder="Tavily Search API Key"
                        value={formData.tavily_api_key}
                        onChange={(e) => setFormData({ ...formData, tavily_api_key: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-2.5 border border-border hover:bg-card text-text-muted text-sm font-semibold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-text text-sm font-semibold rounded-xl transition cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Create Account
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
            </ModalPortal>
          )}
        </AnimatePresence>

        {/* EDIT USER MODAL */}
        <AnimatePresence>
          {isEditModalOpen && selectedUser && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#0b0d19] border border-border max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <Edit className="w-5 h-5 text-red-500" /> Edit Profile: {selectedUser.username}
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-1 text-text-muted hover:text-slate-350 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditUser} className="p-6 overflow-y-auto space-y-4 flex-1">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to retain current password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Learning Goal</label>
                    <input
                      type="text"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Skill Level</label>
                      <select
                        value={formData.skill_level}
                        onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Daily Study (Min)</label>
                      <select
                        value={formData.daily_study_time.toString()}
                        onChange={(e) => setFormData({ ...formData, daily_study_time: Number(e.target.value) })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">120 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Target Date</label>
                    <input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="border-t border-slate-850/60 pt-4 space-y-4">
                    <h4 className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4.5 h-4.5 text-red-500" /> Custom API Keys
                    </h4>
                    <div className="space-y-2.5">
                      <input
                        type="password"
                        placeholder="Gemini API Key"
                        value={formData.gemini_api_key}
                        onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <input
                        type="password"
                        placeholder="Tavily Search API Key"
                        value={formData.tavily_api_key}
                        onChange={(e) => setFormData({ ...formData, tavily_api_key: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-text text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-5 py-2.5 border border-border hover:bg-card text-text-muted text-sm font-semibold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-text text-sm font-semibold rounded-xl transition cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Update Profile
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
            </ModalPortal>
          )}
        </AnimatePresence>

        {/* DELETE USER CONFIRMATION MODAL */}
        <AnimatePresence>
          {isDeleteModalOpen && selectedUser && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="glass-panel bg-card border border-border max-w-md w-full rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-text">Delete User Profile?</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      Are you sure you want to permanently delete user account <strong className="text-text font-semibold">&quot;{selectedUser.username}&quot;</strong>? This will remove all their active roadmaps, milestones, quiz records, and data from the database.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-card border-t border-border flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-5 py-2.5 border border-border hover:bg-background text-text text-sm font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Delete Profile
                  </button>
                </div>
              </motion.div>
            </div>
            </ModalPortal>
          )}
        </AnimatePresence>
        </>
        )}
      </AppShell>
  );
}

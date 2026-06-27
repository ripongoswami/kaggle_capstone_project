"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !success && !error) {
    return (
      <div className="text-center space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium text-center">
          Invalid reset link. Missing token.
        </div>
        <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-indigo-400">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">Set New Password</h1>
        <p className="text-sm text-text-muted">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4"
        >
          <div className="text-emerald-400 font-medium">
            Password reset successfully!
          </div>
          <p className="text-xs text-text-muted">
            Redirecting to login page...
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">
                New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-card/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-card/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-indigo-500 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-20" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

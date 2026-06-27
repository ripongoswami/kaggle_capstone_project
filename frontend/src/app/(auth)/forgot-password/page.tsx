"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to process request. Please try again.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[130px]" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-border shadow-2xl relative z-10">
        <div className="flex flex-col space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">Forgot Password?</h1>
            <p className="text-sm text-text-muted">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4"
            >
              <div className="text-emerald-400 font-medium">
                Reset link sent! Check your email.
              </div>
              <p className="text-xs text-text-muted">
                If you don&apos;t see the email, check your spam folder or try again.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-indigo-500 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 mt-4"
              >
                Back to log in
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-card/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-text placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
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

          <div className="text-center">
            <Link href="/login" className="text-sm font-semibold text-text-muted hover:text-primary transition-colors">
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

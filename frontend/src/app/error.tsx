"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl text-center relative z-10"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3 text-text">Something went wrong</h1>
        <p className="text-text-muted text-sm mb-8">
          We encountered an unexpected error. Please try again or return to the dashboard.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-indigo-500 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary hover:bg-secondary/80 text-text font-semibold rounded-xl transition-all border border-border"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

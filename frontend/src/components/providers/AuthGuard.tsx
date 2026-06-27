"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Public routes that unauthenticated users can access
    const isPublicRoute = pathname === "/" || pathname === "/forgot-password" || pathname === "/reset-password";
    // Auth routes (login/register)
    const isAuthRoute = pathname === "/login" || pathname === "/register";

    if (!token) {
      if (!isPublicRoute && !isAuthRoute) {
        router.replace("/login");
      } else {
        setIsChecking(false);
      }
    } else {
      if (isAuthRoute) {
        router.replace("/dashboard");
      } else {
        setIsChecking(false);
      }
    }
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoadmapPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/roadmap/milestone/1");
  }, [router]);

  return null;
}

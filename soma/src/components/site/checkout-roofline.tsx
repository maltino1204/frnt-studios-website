"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** The one brand moment (design-guideline §10): a roof line draws 0 → 24px above "Bestätigt.". */
export function RoofLineDraw({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return <span aria-hidden className={cn("block h-0.5 bg-ink transition-[width] duration-calm ease-calm", on ? "w-6" : "w-0", className)} />;
}

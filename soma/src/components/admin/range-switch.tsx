"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SegmentedControl } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";

/** Segmented date range (7 / 30 / 90 Tage) that writes ?tage= into the URL. */
export function RangeSwitch({ value, options = [7, 30, 90], className }: { value: number; options?: number[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  return (
    <div className={cn("w-60 transition-opacity", pending && "opacity-60", className)} aria-busy={pending || undefined}>
      <SegmentedControl
        dense
        name="tage"
        label="Zeitraum"
        value={String(value)}
        options={options.map((d) => ({ value: String(d), label: `${d} Tage` }))}
        onChange={(v) => {
          const sp = new URLSearchParams(params?.toString());
          sp.set("tage", v);
          start(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
        }}
      />
    </div>
  );
}

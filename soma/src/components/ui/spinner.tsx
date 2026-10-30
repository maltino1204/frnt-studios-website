import { cn } from "@/lib/cn";

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn("inline-block animate-spin rounded-full border-[1.5px] border-current border-r-transparent", className)}
    />
  );
}

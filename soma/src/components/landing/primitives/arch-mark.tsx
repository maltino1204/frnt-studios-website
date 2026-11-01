import { cn } from "@/lib/cn";

/** The 14 × 7 arch mark (system iconography, like DateStrip's "today" mark): 1.5 px outline in currentColor. */
export function ArchMark({ className, ...props }: { className?: string } & Record<`data-${string}`, string | undefined>) {
  return (
    <span
      aria-hidden
      className={cn("block h-[7px] w-3.5 border-[1.5px] border-b-0 border-current [border-radius:50%_50%_0_0/100%_100%_0_0]", className)}
      {...props}
    />
  );
}

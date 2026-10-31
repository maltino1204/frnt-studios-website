import { createElement } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/cn";

type IconNode = Array<[string, Record<string, string | number>]>;
type IconData = { size?: number; node: IconNode };

const cache = new WeakMap<object, IconData | null>();

/**
 * The icon's path data. lucide-react v1 icons are `forwardRef` wrappers that render its "use client"
 * `<Icon icon={data} />`; reading `data` lets us draw the SVG ourselves, so a Server Component ships plain
 * <svg> markup instead of a client-component reference plus the serialized icon object, and nothing has to
 * hydrate (A5-9).
 */
function iconData(I: LucideIcon): IconData | null {
  if (cache.has(I)) return cache.get(I)!;
  let data: IconData | null = null;
  const render = (I as unknown as { render?: (props: object, ref: null) => { props?: { icon?: IconData } } | null }).render;
  if (typeof render === "function") {
    try {
      const icon = render({}, null)?.props?.icon;
      if (icon && Array.isArray(icon.node)) data = icon;
    } catch {
      data = null;
    }
  }
  cache.set(I, data);
  return data;
}

/**
 * lucide icon with SOMA defaults: 1.5 px absolute stroke, currentColor (design-guideline §9). Decorative
 * (aria-hidden) unless you pass an accessible name. Fill, stroke colour and line caps come from the `ico`
 * class in globals.css, so a `fill-*` or `stroke-*` utility in `className` still wins.
 */
export function Icon({ icon: I, size = 20, strokeWidth = 1.5, absoluteStrokeWidth = true, className, ...props }: { icon: LucideIcon } & LucideProps) {
  const data = iconData(I);
  if (!data) return <I size={size} strokeWidth={strokeWidth} absoluteStrokeWidth={absoluteStrokeWidth} aria-hidden className={className} {...props} />;
  const box = data.size ?? 24;
  const stroke = absoluteStrokeWidth ? Math.round(((Number(strokeWidth) * box) / Number(size)) * 1000) / 1000 : strokeWidth;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} strokeWidth={stroke} aria-hidden className={cn("ico", className)} {...props}>
      {data.node.map(([tag, attrs]) => createElement(tag, attrs))}
    </svg>
  );
}

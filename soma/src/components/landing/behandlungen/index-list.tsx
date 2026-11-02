"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { resolveImage } from "@/lib/images";
import { SwapLayer } from "../hero/swap-layer";
import { useLayerSwap } from "../hero/use-layer-swap";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import type { CategoryItem } from "./types";

const PREVIEW_SIZES = "(min-width: 1440px) 519px, 36vw";
/** Intent delay, so rows crossed by the pointer do not flicker (spec § 4.3). */
const INTENT_MS = 80;

/**
 * 03 on desktop with a fine pointer (spec § 4.3): the editorial index (one link per row, sans list titles) and a
 * sticky preview arch that mirrors the row under the pointer or focus (keyboard parity). The preview is
 * `aria-hidden`; its image layers swap like the hero (`[data-preview-layer][data-state]`), the caption is keyed
 * (`data-preview-caption`, `data-state="entering"` after a swap).
 */
export function IndexList({ items }: { items: CategoryItem[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const { layers, settle, swapped } = useLayerSwap(active);
  const timer = useRef(0);
  const fetched = useRef(false);

  const intend = useCallback((slug: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(slug), INTENT_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const prefetch = () => {
    if (fetched.current) return;
    fetched.current = true;
    for (const it of items.slice(1)) {
      const { props } = getImageProps({ src: resolveImage(it.image) ?? it.image, alt: "", fill: true, sizes: PREVIEW_SIZES });
      const img = new window.Image();
      if (props.sizes) img.sizes = props.sizes;
      if (props.srcSet) img.srcset = props.srcSet;
      img.src = props.src;
    }
  };

  const current = items.find((i) => i.slug === active) ?? items[0];
  if (!current) return null;

  return (
    <div data-scene="index-preview" data-active={active} className="lp-cat-index">
      <ol className="lp-cat-list border-t border-line" onPointerEnter={prefetch} onFocus={prefetch}>
        {items.map((it, i) => (
          <li key={it.slug}>
            <Link
              href={it.href}
              prefetch={false}
              onPointerEnter={() => intend(it.slug)}
              onFocus={() => intend(it.slug)}
              className="group grid min-h-[104px] grid-cols-[2.5rem_minmax(0,1fr)_auto_1.25rem] items-center gap-x-5 border-b border-line px-3 text-ink transition-[background-color,scale] duration-fast ease-standard hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus active:scale-[0.99]"
            >
              <span className="type-label text-ink-muted num">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="type-heading-l">{it.name}</span>
                {it.tagline ? <span className="truncate type-body-s text-ink-muted">{it.tagline}</span> : null}
              </span>
              <span className="flex flex-col items-end gap-0.5 text-right">
                {it.price ? (
                  <>
                    <span className="type-label-s text-ink num">{it.price}</span>
                    <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
                  </>
                ) : null}
              </span>
              <Icon
                icon={ArrowUpRight}
                size={20}
                className="text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </Link>
          </li>
        ))}
      </ol>

      <div aria-hidden className="lp-cat-preview">
        <LandingArch tone={current.slug} reveal="arch">
          {layers.map((l) => {
            const it = items.find((x) => x.slug === l.key) ?? current;
            return (
              <SwapLayer key={l.n} attr="data-preview-layer" state={l.state} n={l.n} onSettle={settle}>
                <LandingImage src={it.image} alt="" sizes={PREVIEW_SIZES} focal={it.focal} />
              </SwapLayer>
            );
          })}
        </LandingArch>
        <div key={current.slug} data-preview-caption="" data-state={swapped ? "entering" : "current"} className="mt-4 flex flex-col gap-1.5">
          <p className="type-heading-m text-ink">{current.name}</p>
          {current.services.length ? <p className="type-body-s text-ink-muted">{current.services.join(" · ")}</p> : null}
          {current.price ? (
            <p className="type-label-s text-ink num">
              {current.price} <span className="type-caption text-ink-muted">· zzgl. Anfahrt</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { AuraBackground } from "@/components/ui/aura";

/**
 * AuraBackground that starts its slow drift only after hydration.
 *
 * Why: MotionRoot flips `data-ambient` on any streamed AuraBackground markup
 * before React hydrates a Suspense-streamed /pro page, which React reports as
 * a hydration attribute mismatch. Rendering static first (no data-ambient) and
 * enabling the drift after mount keeps server and client markup identical.
 */
export function AmbientAura(props: Omit<ComponentProps<typeof AuraBackground>, "animate">) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <AuraBackground {...props} animate={ready} />;
}

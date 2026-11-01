"use client";

import { useState } from "react";

/*
 * "Das Zeichen zeichnet sich" (brand/assets/splash/SPLASH.md): the O's contours draw, the S traces inside, both
 * fill, the contours fade. 1.2 s, once, no loop. Reduced motion shows the final frame. Replay re-mounts the SVG.
 */
type Props = { viewBox: readonly number[]; o: string; s: string; color?: string; size?: number };

export function DrawOn({ viewBox, o, s, color = "#542C35", size = 160 }: Props) {
  const [run, setRun] = useState(0);
  const [x, y, w, h] = viewBox;
  const pad = 5;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <svg
        key={run}
        viewBox={`${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}`}
        role="img"
        aria-label="SOMA Zeichen"
        className="mk-drawon"
        style={{ width: size, height: "auto", display: "block", color }}
      >
        <path className="mk-drawon-o-fill" d={o} />
        <path className="mk-drawon-s-fill" d={s} />
        <path className="mk-drawon-line mk-drawon-o-line" pathLength={1} d={o} />
        <path className="mk-drawon-line mk-drawon-s-line" pathLength={1} d={s} />
      </svg>
      <button type="button" className="mk-btn mk-btnS mk-btnSecondary" onClick={() => setRun((r) => r + 1)}>
        Noch einmal abspielen
      </button>
    </div>
  );
}

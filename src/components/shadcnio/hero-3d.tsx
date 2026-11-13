"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The picture for the 3D hero look. The 3D code is big, so it is only fetched
 * by pages that use this look, after the page itself is up. Until it has drawn
 * (and on a device that can't draw 3D at all) a plain grey outline of the hills
 * holds its place, so there is never an empty gap.
 */
export function Hero3D({ signs, moving }: { signs: string[]; moving: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  // The names as one value, so the scene is only rebuilt when they really change.
  const names = signs.join("\n");

  useEffect(() => {
    let stop: (() => void) | undefined;
    let gone = false;
    void import("./hero-3d-scene")
      .then(({ startHero3D }) => {
        if (gone || !host.current || !canvas.current || !band.current) return;
        stop = startHero3D({
          canvas: canvas.current,
          host: host.current,
          strip: band.current,
          signs: names ? names.split("\n") : [],
          moving,
          onReady: () => setDrawn(true),
        }).stop;
      })
      // No 3D on this device (or the code didn't arrive): the outline stays.
      .catch(() => undefined);
    return () => {
      gone = true;
      stop?.();
    };
  }, [names, moving]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex select-none flex-col justify-end" ref={host}>
      <canvas className={cn("hero-3d-canvas absolute inset-0 size-full", !drawn && "invisible")} ref={canvas} />
      <div className="hero-3d-band relative" ref={band}>
        {drawn ? null : (
          <svg className="absolute inset-0 size-full fill-muted" preserveAspectRatio="none" viewBox="0 0 1200 300">
            <path d="M0 300V150C120 120 210 96 330 118S520 170 640 140S850 84 980 108S1130 150 1200 132V300z" />
          </svg>
        )}
      </div>
    </div>
  );
}

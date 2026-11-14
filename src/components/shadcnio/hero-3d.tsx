"use client";

import dynamic from "next/dynamic";
import { Suspense, useLayoutEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { InlineScript } from "@/components/inline-script";
import { cn } from "@/lib/utils";
import { CHARACTER_FILES } from "./hero-3d-files";
import { STILL_SCRIPT, showStill } from "./hero-3d-still";

// The 3D code is big, so it is its own download, fetched only by pages that use
// this look. Loading it this way lets the page ask for it the moment it arrives,
// alongside everything else, instead of once the rest of the page is up and running.
const Hero3DLive = dynamic(() => import("./hero-3d-live"));

/**
 * The picture for the 3D hero look. Until the scene has drawn (and on a device
 * that can't draw 3D at all) something always holds its place, so there is
 * never an empty gap: the picture remembered from the last visit if there is
 * one (see hero-3d-still.ts), otherwise a plain grey outline of the hills.
 */
export function Hero3D({ signs, moving }: { signs: string[]; moving: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  // The names as one value, so the scene is only rebuilt when they really change.
  const names = signs.join("\n");

  // The characters are asked for along with the page, not after the 3D code has arrived.
  for (const file of CHARACTER_FILES) preload(file, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });

  // Arriving from another page of the site: the script below doesn't run then, so this does its job.
  useLayoutEffect(() => {
    if (host.current) showStill(host.current);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex select-none flex-col justify-end" data-signs={names} ref={host} suppressHydrationWarning>
      <canvas className={cn("hero-3d-canvas absolute inset-0 size-full", !drawn && "invisible")} ref={canvas} />
      {drawn ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- a picture the browser saved itself, set by the script below
        <img alt="" className="hero-3d-canvas hero-3d-still" suppressHydrationWarning />
      )}
      <div className="hero-3d-band relative" ref={band}>
        {drawn ? null : (
          <svg className="absolute inset-0 size-full fill-muted" preserveAspectRatio="none" viewBox="0 0 1200 300">
            <path d="M0 300V150C120 120 210 96 330 118S520 170 640 140S850 84 980 108S1130 150 1200 132V300z" />
          </svg>
        )}
      </div>
      <InlineScript html={STILL_SCRIPT} />
      <Suspense fallback={null}>
        <Hero3DLive canvas={canvas} host={host} moving={moving} names={names} setDrawn={setDrawn} strip={band} />
      </Suspense>
    </div>
  );
}

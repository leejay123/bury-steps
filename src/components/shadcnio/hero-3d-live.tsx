"use client";

import { useEffect, type RefObject } from "react";
import { startHero3D, type Hero3D } from "./hero-3d-scene";
import { rememberStill } from "./hero-3d-still";

/**
 * The moving part of the 3D hero look: starts the scene in the canvas that
 * hero-3d.tsx has laid out, and stops it again when the page is left. It draws
 * nothing itself. Kept in its own file because it brings the (big) 3D code with it.
 */
export default function Hero3DLive({
  canvas,
  host,
  strip,
  names,
  moving,
  setDrawn,
}: {
  canvas: RefObject<HTMLCanvasElement | null>;
  host: RefObject<HTMLDivElement | null>;
  strip: RefObject<HTMLDivElement | null>;
  /** The signpost names, one per line. */
  names: string;
  moving: boolean;
  setDrawn: (drawn: boolean) => void;
}) {
  useEffect(() => {
    const box = host.current;
    if (!box || !canvas.current || !strip.current) return;
    let scene: Hero3D | undefined;
    let gone = false;
    let wait: ReturnType<typeof setTimeout> | undefined;
    try {
      scene = startHero3D({
        canvas: canvas.current,
        host: box,
        strip: strip.current,
        signs: names ? names.split("\n") : [],
        moving,
        onReady: () => setDrawn(true),
        onCast: () => {
          // Once things have settled (and the site's font is in, for the signposts), keep a picture for next time.
          wait = setTimeout(() => {
            void (document.fonts?.ready ?? Promise.resolve()).then(() => {
              if (!gone) rememberStill(box, () => scene?.snapshot() ?? null);
            });
          }, 1500);
        },
      });
    } catch {
      // No 3D on this device: the outline (or the remembered picture) stays.
    }
    return () => {
      gone = true;
      clearTimeout(wait);
      scene?.stop();
    };
  }, [canvas, host, strip, names, moving, setDrawn]);

  return null;
}

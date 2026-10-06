"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { MetalFx as MetalFxType } from "metal-fx";
import { Button } from "@/components/ui/button";

type MetalFxComponent = typeof MetalFxType;

// Shared by every Join button on the page, so the effect is fetched once.
let metalFxPromise: Promise<MetalFxComponent> | null = null;
const loadMetalFx = () => (metalFxPromise ??= import("metal-fx").then((mod) => mod.MetalFx));

const INTRO_MS = 4000;

export function JoinGroupButton({ href }: { href: string }) {
  // The silver shimmer is a WebGL effect — a large script and a shader to
  // compile. Computers only (a mouse and hover): it's added once the page
  // has loaded and the browser is idle. Phones keep the plain black button —
  // preparing the effect on the first touch froze the page for about a
  // second, so the tap that triggered it seemed to do nothing (and it costs
  // battery). It used to start on the first mouse move, which put that
  // ~100-170 ms setup right in the middle of someone moving the mouse.
  const [MetalFx, setMetalFx] = useState<MetalFxComponent | null>(null);
  // It shimmers for a few seconds when it appears, then rests on a still
  // frame (the metal look stays) and shimmers again on hover or focus — left
  // running, it kept a computer's processor busy on every visitor page,
  // since the header is always in view. Still throughout for anyone who
  // has asked for less motion.
  const [intro, setIntro] = useState(true);
  const [pointedAt, setPointedAt] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!MetalFx) return;
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [MetalFx]);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let cancelled = false;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(
      () => {
        void loadMetalFx().then((component) => {
          if (cancelled) return;
          setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          setMetalFx(() => component);
        });
      },
      { timeout: 4000 },
    );
    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, []);

  const button = (
    <Button asChild className="bg-black text-white hover:bg-black" size="sm">
      <a
        href={href}
        onBlur={() => setPointedAt(false)}
        onFocus={() => setPointedAt(true)}
        onMouseEnter={() => setPointedAt(true)}
        onMouseLeave={() => setPointedAt(false)}
      >
        Join the group
      </a>
    </Button>
  );

  if (!MetalFx) return button;
  const Metal = MetalFx as ComponentType<React.ComponentProps<MetalFxComponent>>;
  return (
    <Metal
      // metal-fx hides the button until its first WebGL frame lands; on
      // phones where that never happens the button stayed invisible and
      // untappable. Keep it visible and let only the link take taps. Rounded
      // like the button from the start: metal-fx only sets its corners once
      // it has measured the button, so the black fill showed square corners
      // on page load.
      className="visible! rounded-md opacity-100! [&>:not(a)]:pointer-events-none"
      paused={reduceMotion || !(intro || pointedAt)}
      preset="silver"
      strength={0.9}
      style={{ background: "#000" }}
      theme="dark"
    >
      {button}
    </Metal>
  );
}

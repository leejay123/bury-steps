"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { MetalFx as MetalFxType } from "metal-fx";
import { Button } from "@/components/ui/button";

type MetalFxComponent = typeof MetalFxType;

// Shared by every Join button on the page, so the effect is fetched once.
let metalFxPromise: Promise<MetalFxComponent> | null = null;
const loadMetalFx = () => (metalFxPromise ??= import("metal-fx").then((mod) => mod.MetalFx));

export function JoinGroupButton({ href }: { href: string }) {
  // The silver shimmer is a WebGL effect — a large script and a shader to
  // compile, which was the biggest single block of work on every page load
  // (GTmetrix "Total Blocking Time"). The plain black button shows first;
  // the shimmer is added once the browser is idle after loading.
  const [MetalFx, setMetalFx] = useState<MetalFxComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      void loadMetalFx().then((component) => {
        if (!cancelled) setMetalFx(() => component);
      });
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 4000 })
      : window.setTimeout(start, 2500);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  const button = (
    <Button asChild className="bg-black text-white hover:bg-black" size="sm">
      <a href={href}>Join the group</a>
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
      preset="silver"
      strength={0.9}
      style={{ background: "#000" }}
      theme="dark"
    >
      {button}
    </Metal>
  );
}

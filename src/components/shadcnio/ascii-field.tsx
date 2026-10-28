"use client";

import { useEffect, useRef } from "react";

const WORD = "BURYSTEPS";
const SCRAMBLE = "#$%&@?!*=+<>/\\";
const CELL_W = 6.4;
const CELL_H = 10;

/** Smooth value noise, enough for a slowly drifting cloud. */
function noise(x: number, y: number, t: number) {
  return (
    Math.sin(x * 0.9 + t * 0.35) * 0.5 +
    Math.sin(y * 1.7 - t * 0.27 + x * 0.4) * 0.35 +
    Math.sin((x + y) * 0.6 + t * 0.2) * 0.25
  );
}

/**
 * The hero's moving letter field, after shadcn.io's: rows of the group's name
 * in small mono letters, thick along the bottom of the hero and thinning out
 * into + : · at the edges, slowly drifting; letters near the pointer scramble.
 * Stops when off screen and stays still for people who ask for less motion.
 */
export function AsciiField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || now - last < 50) return;
      last = now;
      const t = reduce ? 0 : now / 1000;
      const ink = getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `500 ${CELL_H - 1}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = ink;
      const cols = Math.ceil(width / CELL_W);
      const rows = Math.ceil(height / CELL_H);
      for (let r = 0; r < rows; r++) {
        const y = r * CELL_H;
        const v = y / height;
        // Thickest in a band low in the hero; a faint cloud top right.
        const band = Math.max(0, 1 - Math.abs(v - 0.87) / 0.15);
        const corner = Math.max(0, 1 - Math.hypot((0.85 - 0) * 1, v - 0.12) / 0.2);
        for (let c = 0; c < cols; c++) {
          const x = c * CELL_W;
          const u = x / width;
          const edge = Math.min(u, 1 - u) * 6;
          const n = noise(u * 9, v * 9, t);
          let d = band * Math.min(1, edge) + n * 0.22 * band;
          const cornerHere = corner * Math.max(0, 1 - Math.abs(u - 0.85) / 0.14);
          d = Math.max(d, cornerHere * 0.6 + n * 0.15);
          let ch = "";
          if (d > 0.62) ch = WORD[(r * 3 + c) % WORD.length]!;
          else if (d > 0.5) ch = "+";
          else if (d > 0.4) ch = ":";
          else if (d > 0.32) ch = "·";
          if (!ch) continue;
          const dist = Math.hypot(x - pointer.x, y - pointer.y);
          if (dist < 70 && !reduce) ch = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]!;
          ctx.globalAlpha = Math.min(0.42, 0.1 + d * 0.35);
          ctx.fillText(ch, x, y);
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    seen.observe(canvas);
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      seen.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full text-foreground [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
      ref={canvasRef}
    />
  );
}

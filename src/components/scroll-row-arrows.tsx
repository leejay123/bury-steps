"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ‹ › buttons on any row that scrolls sideways, while a mouse hovers it.
 * A mouse wheel only scrolls up and down, and the site hides scrollbars, so
 * without these a mouse can't move those rows (a trackpad or a finger can
 * swipe them). Only for a pointer that can hover; phones never see them.
 */
export function ScrollRowArrows() {
  const [row, setRow] = useState<HTMLElement | null>(null);
  const [place, setPlace] = useState<{
    top: number;
    left: number;
    right: number;
    back: boolean;
    forward: boolean;
  } | null>(null);
  const buttons = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let current: HTMLElement | null = null;
    const scrollerOf = (start: EventTarget | null): HTMLElement | null => {
      let el = start instanceof Element ? start : null;
      while (el && el !== document.body) {
        if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1) {
          const x = getComputedStyle(el).overflowX;
          if (x === "auto" || x === "scroll") return el;
        }
        el = el.parentElement;
      }
      return null;
    };
    const measure = () => {
      if (!current || !current.isConnected) {
        current = null;
        setRow(null);
        setPlace(null);
        return;
      }
      const r = current.getBoundingClientRect();
      const max = current.scrollWidth - current.clientWidth;
      setPlace({
        top: r.top + r.height / 2,
        left: r.left,
        right: r.right,
        back: current.scrollLeft > 1,
        forward: current.scrollLeft < max - 1,
      });
    };
    const onMove = (event: MouseEvent) => {
      if (!canHover.matches) return;
      if (buttons.current?.contains(event.target as Node)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = scrollerOf(event.target);
        if (next !== current) {
          current = next;
          setRow(next);
        }
        measure();
      });
    };
    const onScroll = () => {
      if (current) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
      }
    };
    const onLeave = () => {
      current = null;
      setRow(null);
      setPlace(null);
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!row || !place || (!place.back && !place.forward)) return null;
  const move = (direction: 1 | -1) =>
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: "smooth" });
  const button =
    "pointer-events-auto fixed z-40 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background/95 text-foreground shadow-sm hover:bg-muted";
  return createPortal(
    <div className="pointer-events-none" ref={buttons}>
      {place.back ? (
        <button
          aria-label="Scroll back"
          className={button}
          onClick={() => move(-1)}
          style={{ top: place.top, left: place.left + 2 }}
          type="button"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
        </button>
      ) : null}
      {place.forward ? (
        <button
          aria-label="Scroll forward"
          className={button}
          onClick={() => move(1)}
          style={{ top: place.top, left: place.right - 26 }}
          type="button"
        >
          <ChevronRight aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

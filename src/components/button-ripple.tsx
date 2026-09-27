"use client";

import { useEffect } from "react";

// Site-wide version of shadcn studio's RippleButton (Button 39): a circle of
// the button's text colour grows from the tap point and fades over 600ms.
// Done with one delegated listener so every Button — including asChild links
// and server-rendered ones — gets it without changing each call site.
export function ButtonRipple() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLElement>('[data-slot="button"]');
      if (!button || button.dataset.variant === "link") return;
      if (button.matches(":disabled, [aria-disabled='true']")) return;

      const rect = button.getBoundingClientRect();
      // Its own clipped layer, so the button itself never needs overflow:hidden
      // (that would cut off things like the bell's unread dot).
      const layer = document.createElement("span");
      layer.setAttribute("aria-hidden", "true");
      Object.assign(layer.style, {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
      });
      const ripple = document.createElement("span");
      Object.assign(ripple.style, {
        position: "absolute",
        left: `${event.clientX - rect.left - 10}px`,
        top: `${event.clientY - rect.top - 10}px`,
        width: "20px",
        height: "20px",
        borderRadius: "9999px",
        background: "currentColor",
      });
      layer.appendChild(ripple);
      if (getComputedStyle(button).position === "static") button.style.position = "relative";
      button.appendChild(layer);

      ripple
        .animate(
          [
            { transform: "scale(0)", opacity: 0.5 },
            { transform: "scale(10)", opacity: 0 },
          ],
          { duration: 600, easing: "ease-out" },
        )
        .finished.catch(() => {})
        .finally(() => layer.remove());
    }

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}

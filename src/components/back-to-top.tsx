"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHOW_AFTER_PX = 480;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/** Re-renders only when the answer flips, not on every scroll event. */
const scrolledFar = () => window.scrollY > SHOW_AFTER_PX;
const notScrolledOnServer = () => false;

export function BackToTop() {
  const visible = useSyncExternalStore(subscribe, scrolledFar, notScrolledOnServer);

  if (!visible) return null;

  return (
    <Button
      aria-label="Back to top"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(max(2rem,calc(env(safe-area-inset-bottom)+1rem))+var(--bottom-nav-offset,0px))] z-50 shadow-md md:right-[max(1.5rem,env(safe-area-inset-right))]"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      size="icon"
    >
      <ArrowUp />
    </Button>
  );
}

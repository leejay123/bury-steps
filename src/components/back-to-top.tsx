"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shown = window.scrollY > 480;
    setVisible(shown);
    const onScroll = () => {
      const next = window.scrollY > 480;
      if (next === shown) return;
      shown = next;
      setVisible(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      aria-label="Back to top"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] z-50 shadow-md md:right-[max(1.5rem,env(safe-area-inset-right))]"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      size="icon"
    >
      <ArrowUp />
    </Button>
  );
}

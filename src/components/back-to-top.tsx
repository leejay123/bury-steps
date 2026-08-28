"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      aria-label="Back to top"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-8 z-50 shadow-md md:right-[max(1.5rem,env(safe-area-inset-right))]"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      size="icon"
    >
      <ArrowUp />
    </Button>
  );
}

import Link from "next/link";
import { ArrowDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The hero's buttons for signed-out visitors. Sign in and Join the group
 * are already in the header, so the hero offers the next step for someone
 * still deciding: how the walks work (further down the homepage) and a way
 * to ask a question. `tone="dark"` is for heroes over a video or photo.
 */
export function HeroGuestActions({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button asChild className={dark ? "bg-white text-black hover:bg-white/90" : undefined} data-ripple="off" size="sm">
        <a href="#howWalksWork">
          How it works
          <ArrowDownIcon data-icon="inline-end" />
        </a>
      </Button>
      <Button
        asChild
        className={dark ? "border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white" : undefined}
        size="sm"
        variant="outline"
      >
        <Link href="/contact">Contact us</Link>
      </Button>
    </div>
  );
}

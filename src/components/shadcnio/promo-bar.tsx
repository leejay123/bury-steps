"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";

function countdown(ms: number) {
  if (ms <= 0) return "Starting now";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86_400);
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(Math.floor((total % 86_400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

/** shadcn.io's bar along the bottom of the screen, here counting down to the next walk. */
export function PromoBar({ next }: { next: { title: string; startsAt: string; href: string } | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  // html[data-promo-bar] gives the footer room above the bar (shadcnio.css): a plain label
  // rather than html:has(…), which rechecked the whole page on every change.
  const shown = Boolean(next);
  useLayoutEffect(() => {
    if (!shown) return;
    const html = document.documentElement;
    html.setAttribute("data-promo-bar", "");
    return () => html.removeAttribute("data-promo-bar");
  }, [shown]);
  if (!next) return null;
  return (
    <aside
      aria-label={`Next walk: ${next.title}`}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(var(--promo-bar)+env(safe-area-inset-bottom))] items-center border-border border-t bg-background/80 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      data-slot="promo-bar"
    >
      <script
        dangerouslySetInnerHTML={{ __html: 'document.documentElement.setAttribute("data-promo-bar","")' }}
        suppressHydrationWarning
      />
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
        <Link className="group flex min-w-0 cursor-pointer items-center gap-2 text-sm transition-colors hover:text-foreground" href={next.href}>
          <span className="min-w-0 truncate text-muted-foreground">
            <span className="font-medium text-foreground">Next walk — {next.title}</span>
            <span className="mx-1.5">·</span>
            <span className="hidden sm:inline">Starts in </span>
            <span dir="ltr">
              <span className="font-mono text-sm tabular-nums" role="timer" suppressHydrationWarning>
                {now === null ? "--:--:--" : countdown(Date.parse(next.startsAt) - now)}
              </span>
            </span>
          </span>
          <span aria-hidden="true" className="text-muted-foreground transition-colors group-hover:text-foreground">
            →
          </span>
        </Link>
      </div>
    </aside>
  );
}

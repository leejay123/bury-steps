"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { StickyBanner } from "@/components/velora/sticky-banner";

const KEY = "announcement-dismissed";

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * The organisers' announcement (Settings → Site behaviour) as Velora's
 * sticky banner, inside the sticky header so the two stay pinned together.
 * Closing it hides it for the rest of the visit; new wording shows again,
 * since the dismissal is remembered against the exact text.
 */
export function AnnouncementBanner({ text, link }: { text: string; link: string }) {
  const dismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => null) === text;
  if (dismissed) return null;

  const onDismiss = () => {
    try {
      sessionStorage.setItem(KEY, text);
    } catch {
      // Private browsing: it just shows again on the next page.
    }
  };

  return (
    <StickyBanner className="static" onDismiss={onDismiss}>
      {link ? (
        <Link className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline" href={link}>
          {text}
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </Link>
      ) : (
        <span className="font-medium">{text}</span>
      )}
    </StickyBanner>
  );
}

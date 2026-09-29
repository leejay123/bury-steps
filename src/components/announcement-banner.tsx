"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { StickyBanner } from "@/components/velora/sticky-banner";

/** localStorage: { id, until } — which wording was closed, and when to show it again. */
const KEY = "announcement-dismissed";
const HIDE_FOR_MS = 24 * 60 * 60 * 1000;

/** Short, CSS-safe id for one wording of the announcement (djb2, base 36). */
export function announcementId(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * A plain inline script placed just before the bar in the server-rendered
 * page, so the browser runs it while reading the page — before anything is
 * drawn. (Next's <Script beforeInteractive> is queued until after the first
 * paint, which is what let the closed bar flash up.) The page is built on the
 * server, which can't know this visitor closed the bar, so this hides the
 * closed wording with a style rule for the rest of its day.
 */
export const ANNOUNCEMENT_PREPAINT_SCRIPT = `try{var d=JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})||"null");if(d&&d.until>Date.now()&&/^[a-z0-9]+$/.test(d.id)){var s=document.createElement("style");s.textContent='[data-announcement-id="'+d.id+'"]{display:none!important}';document.head.appendChild(s)}}catch(e){}`;

function readDismissed(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as { id?: unknown; until?: unknown }) : null;
    return saved && typeof saved.id === "string" && typeof saved.until === "number" && saved.until > Date.now()
      ? saved.id
      : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * The organisers' announcement (Settings → Site behaviour) as Velora's
 * sticky banner, inside the sticky header so the two stay pinned together.
 * Closing it hides it for a day in this browser; new wording shows again
 * straight away, since the dismissal is remembered against that wording's id.
 */
export function AnnouncementBanner({ text, link }: { text: string; link: string }) {
  const id = announcementId(text);
  const dismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => null) === id;
  if (dismissed) return null;

  const onDismiss = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ id, until: Date.now() + HIDE_FOR_MS }));
    } catch {
      // Private browsing: it just shows again on the next page.
    }
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANNOUNCEMENT_PREPAINT_SCRIPT }} />
      <StickyBanner className="static" data-announcement-id={id} onDismiss={onDismiss}>
        {link ? (
          <Link className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline" href={link}>
            {text}
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          </Link>
        ) : (
          <span className="font-medium">{text}</span>
        )}
      </StickyBanner>
    </>
  );
}

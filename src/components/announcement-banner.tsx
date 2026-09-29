"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { StickyBanner } from "@/components/velora/sticky-banner";

const KEY = "announcement-dismissed";

/** Short, CSS-safe id for one wording of the announcement (djb2, base 36). */
function announcementId(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * Runs in <head> before the page is painted. The page is built on the
 * server, which can't see that this visitor closed the bar, so without this
 * the bar would flash up and vanish again on every refresh. It hides the
 * closed wording with a style rule before anything is drawn.
 */
export const ANNOUNCEMENT_PREPAINT_SCRIPT = `try{var d=sessionStorage.getItem(${JSON.stringify(KEY)});if(d&&/^[a-z0-9]+$/.test(d)){var s=document.createElement("style");s.textContent='[data-announcement-id="'+d+'"]{display:none!important}';document.head.appendChild(s)}}catch(e){}`;

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
 * since the dismissal is remembered against that wording's id.
 */
export function AnnouncementBanner({ text, link }: { text: string; link: string }) {
  const id = announcementId(text);
  const dismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => null) === id;
  if (dismissed) return null;

  const onDismiss = () => {
    try {
      sessionStorage.setItem(KEY, id);
    } catch {
      // Private browsing: it just shows again on the next page.
    }
  };

  return (
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
  );
}

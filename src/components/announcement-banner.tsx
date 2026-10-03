"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { StickyBanner } from "@/components/velora/sticky-banner";
import { ANNOUNCEMENT_MATCH_JS, announcementShowsOn } from "@/lib/announcement-pages";
import { useClientPathname } from "@/components/client-pathname";

/** localStorage: { id, until } — which wording was closed, and when to show it again. */
const KEY = "announcement-dismissed";
const HIDE_FOR_MS = 24 * 60 * 60 * 1000;
/** Set on <html> by the pre-paint script; globals.css hides the bar while it's there. */
const HIDE_ATTR = "data-announcement-hide";

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
 * paint, which is what let a closed bar flash up.) It hides the bar when
 * this page isn't one it's meant for, or this visitor closed this wording
 * within the last day. Once React takes over it decides for itself and
 * lifts the flag (see the effect below).
 */
function prepaintScript(id: string, pages: string): string {
  const json = (value: string) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `(function(){try{var m=${ANNOUNCEMENT_MATCH_JS};var hide=!m(${json(pages)},location.pathname);if(!hide){var d=JSON.parse(localStorage.getItem(${json(KEY)})||"null");hide=!!(d&&d.until>Date.now()&&d.id===${json(id)})}if(hide)document.documentElement.setAttribute(${json(HIDE_ATTR)},"")}catch(e){}})()`;
}

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

function rememberDismissed(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, until: Date.now() + HIDE_FOR_MS }));
  } catch {
    // Private browsing: it just shows again on the next page.
  }
}

/**
 * The organisers' announcement (Settings → Site behaviour) as Velora's
 * sticky banner, inside the sticky header so the two stay pinned together.
 * Shows only on the pages chosen in settings. Closing it hides it for a day
 * in this browser; new wording shows again straight away, since the
 * dismissal is remembered against that wording's id.
 */
export function AnnouncementBanner({ text, link, pages }: { text: string; link: string; pages: string }) {
  const id = announcementId(text);
  // null until the browser knows the page — the pre-paint flag keeps the
  // bar hidden on pages it isn't for until then.
  const pathname = useClientPathname();
  const dismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => null) === id;

  // React now decides whether the bar shows; the pre-paint flag has done its job.
  useEffect(() => {
    if (pathname !== null) document.documentElement.removeAttribute(HIDE_ATTR);
  }, [pathname]);

  if (dismissed || (pathname !== null && !announcementShowsOn(pages, pathname))) {
    return <script dangerouslySetInnerHTML={{ __html: prepaintScript(id, pages) }} />;
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: prepaintScript(id, pages) }} />
      <StickyBanner className="static" data-announcement-id={id} onDismiss={() => rememberDismissed(id)}>
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

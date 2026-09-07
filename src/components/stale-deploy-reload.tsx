"use client";

/**
 * A tab left open across a deploy still holds the previous build's chunk
 * filenames. The moment it tries to fetch one of those — a lazy import
 * (Route3DToggle's own chunk, most likely to be opened long after the tab
 * was first loaded), or a script tag pointed at a same-page navigation's
 * new build — the new deployment doesn't have that file any more, so the
 * server's catch-all sends its normal "page not found" HTML back instead.
 * The browser trying to run that HTML as a module script is exactly the
 * "non-JavaScript MIME type of text/html" error: real, and not something
 * a page can prevent, since it doesn't know its own build is stale until
 * it tries to fetch something that no longer exists.
 *
 * What it can do is stop presenting that as a dead end: reload once,
 * automatically, the moment this happens. A fresh load always gets the
 * current build's chunk manifest, so the reload fixes it outright rather
 * than leaving someone to work out "refresh the page" on their own,
 * usually mid-walk on a phone with the failure sitting in place of
 * whatever they were trying to see.
 */

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "bs-stale-deploy-reload-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;

function isStaleChunkFailure(message: string | undefined | null): boolean {
  if (!message) return false;
  return /loading chunk|dynamically imported module|non-javascript mime type|chunkloaderror/i.test(
    message,
  );
}

/** Reloads at most once every 10s — if the new build is itself broken (not
 * just this tab being stale), that's a real deploy problem a reload loop
 * would only hide, not fix. */
function reloadOnce() {
  try {
    const lastAt = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    if (Date.now() - lastAt < RELOAD_GUARD_WINDOW_MS) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode, cookies off) — reload anyway; the
    // worst case is one extra reload, not a loop, since this only runs
    // once per real failure either way.
  }
  window.location.reload();
}

export function StaleDeployReload() {
  useEffect(() => {
    // A failed <script type="module"> load fires a non-bubbling 'error'
    // event on the element itself — only a capturing listener on window
    // sees it. Its message is empty, so this checks what failed rather
    // than why.
    function onScriptError(event: Event) {
      const target = event.target;
      if (
        target instanceof HTMLScriptElement &&
        (target.type === "module" || target.noModule) &&
        target.src
      ) {
        reloadOnce();
      }
    }

    // A stale dynamic import() (React.lazy, next/dynamic) rejects instead —
    // that's how Route3DToggle's own chunk would fail on a tab left open
    // since before this exact code shipped.
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (isStaleChunkFailure(event.reason?.message)) reloadOnce();
    }

    window.addEventListener("error", onScriptError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onScriptError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

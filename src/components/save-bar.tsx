"use client";

/**
 * The save bar (after Shopify's: polaris.shopify.com/components/contextual-save-bar).
 * Settings forms don't show their own Save button: once something on the page is
 * changed, a small bar shows under the top bar with "Unsaved changes", Discard
 * and Save. Save sends every changed form on the page; Discard puts them all back.
 * Following a link away while something is unsaved asks first.
 *
 * A form joins with `useSaveBar(dirty, pending, discard)` and puts the returned
 * ref on its <form>. The page shows the bar with <SaveBar />.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Entry = {
  form: { current: HTMLFormElement | null };
  discard: () => void;
  pending: boolean;
};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let snapshot = { count: 0, pending: false };

function changed() {
  const all = [...entries.values()];
  snapshot = { count: all.length, pending: all.some((entry) => entry.pending) };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY = { count: 0, pending: false };

/** Joins a form to the page's save bar while it has unsaved changes (or is saving). */
export function useSaveBar(dirty: boolean, pending: boolean, discard: () => void) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const discardRef = useRef(discard);
  useLayoutEffect(() => {
    discardRef.current = discard;
  });

  // A layout effect, so a page Next puts away (kept alive but hidden) leaves
  // the bar at once: its cleanup runs before it's hidden.
  useLayoutEffect(() => {
    if (!dirty && !pending) return;
    entries.set(id, { form, discard: () => discardRef.current(), pending });
    changed();
    return () => {
      entries.delete(id);
      changed();
    };
  }, [dirty, pending, id]);

  return form;
}

function saveAll() {
  for (const entry of entries.values()) {
    if (!entry.pending) entry.form.current?.requestSubmit();
  }
}

function discardAll() {
  for (const entry of [...entries.values()]) entry.discard();
}

/** Where a click on a link inside the site would go, or null if it stays put. */
function leavingTo(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== "_self") return null;
  if (link.hasAttribute("download")) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url.pathname + url.search + url.hash;
}

export function SaveBar() {
  const { count, pending } = useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);
  const shown = count > 0;

  useEffect(() => {
    if (!shown) return;
    // Closing the tab or reloading: the browser's own "Leave site?" question.
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    // A link inside the site: ask in our own dialog first. Capture, so it runs
    // before the link's own click handler.
    const click = (event: MouseEvent) => {
      const href = leavingTo(event);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(href);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [shown]);

  // Without the dashboard's top bar it sits at the top of the window instead.
  const found = shown ? document.querySelector<HTMLElement>('[data-slot="efferd-header"]') : null;
  const header = found?.getClientRects().length ? found : null;
  // A small light bar just under the top bar, in the dashboard's own style (border, card
  // colour, small buttons). It hangs below the bar, so the sidebar button stays usable.
  const bar = (
    <div
      className={cn(
        "pointer-events-none z-50 flex justify-center px-4",
        header ? "absolute inset-x-0 top-full mt-2" : "fixed inset-x-0 top-2",
      )}
      data-save-bar=""
    >
      <div
        aria-label="Unsaved changes"
        className="pointer-events-auto flex animate-in items-center gap-3 rounded-lg border bg-background py-1 ps-3 pe-1 shadow-md duration-150 fade-in slide-in-from-top-1"
        role="region"
      >
        <p aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">Unsaved changes</span>
        </p>
        <div className="flex shrink-0 gap-1">
          <Button disabled={pending} onClick={discardAll} size="xs" type="button" variant="ghost">
            Discard
          </Button>
          <Button disabled={pending} onClick={saveAll} size="xs" type="button">
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {shown ? createPortal(bar, header ?? document.body) : null}
      <AlertDialog onOpenChange={(open) => !open && setLeaving(null)} open={leaving !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes on this page haven&apos;t been saved. If you leave now they&apos;ll be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const href = leaving;
                discardAll();
                setLeaving(null);
                if (href) router.push(href);
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

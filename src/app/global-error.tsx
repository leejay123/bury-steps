"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Catches errors thrown by the root layout itself (a normal `error.tsx`
 * only catches errors from the page/segment below it — not the layout it
 * sits inside). This is the last line of defence: if it renders, something
 * broke badly enough that the header, nav and footer never mounted, so it
 * has to supply its own `<html>`/`<body>` and can't lean on anything from
 * `layout.tsx`, including Clerk, the theme, or the site nav.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground antialiased">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page hit an unexpected error and couldn&apos;t load. Try again, or head back to the
          homepage. Tell an organiser if it keeps happening.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <a
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
            href="/"
          >
            Home
          </a>
        </div>
      </body>
    </html>
  );
}

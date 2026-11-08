"use client";

import { useEffect } from "react";
import { StatusMessagePage } from "@/components/not-found";
import "./globals.css";

/**
 * Catches errors thrown by the root layout itself (a normal `error.tsx`
 * only catches errors from the page/segment below it — not the layout it
 * sits inside). This is the last line of defence: if it renders, something
 * broke badly enough that the header, nav and footer never mounted, so it
 * has to supply its own `<html>`/`<body>` and can't lean on anything from
 * `layout.tsx`, including Clerk, the theme, or the site nav. It looks the
 * same as the Offline page; its Home link is a plain one (a full page load),
 * since the app's own routing may be what broke.
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
      <body className="bg-background text-foreground antialiased">
        <StatusMessagePage
          description="Nothing was saved. Try again in a moment. Tell an organiser if it keeps happening."
          kicker="Error"
          plainLinks
          primary={{ label: "Try again", onClick: reset }}
          secondary={{ href: "/", label: "Home" }}
          title="Something went wrong"
        />
      </body>
    </html>
  );
}

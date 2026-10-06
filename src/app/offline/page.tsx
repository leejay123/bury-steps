import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/** Shown by the service worker when a page can't be loaded and isn't saved on the phone. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-3 px-4 py-16">
      <h1 className="text-lg font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        A walk you already opened should still be here. Anything new will load again once you
        have a signal.
      </p>
      <Link className="text-sm font-medium underline" href="/walks">
        Try Walks again
      </Link>
    </div>
  );
}

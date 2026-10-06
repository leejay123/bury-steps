"use client";

import { lazy, Suspense, type ComponentProps, type ReactNode } from "react";
import { AvatarPlaceholder } from "@/components/header-placeholders";

/**
 * Clerk's browser code, split off so it's only downloaded when one of
 * these is actually on the page — i.e. for signed-in people. Next.js
 * bundles every client component a layout file mentions, shown or not, so
 * importing Clerk directly there shipped ~90 KB (compressed) of it to every
 * signed-out visitor too.
 *
 * On the server these resolve before the HTML is sent, so signed-in pages
 * render exactly as before; in the browser, React waits for the split-off
 * code before bringing that part of the page to life.
 */
const ClerkProviderInner = lazy(() => import("@clerk/nextjs").then((mod) => ({ default: mod.ClerkProvider })));
const SiteUserButtonInner = lazy(() =>
  import("@/components/site-user-button").then((mod) => ({ default: mod.SiteUserButton })),
);
const ImpersonationBannerInner = lazy(() =>
  import("@/components/impersonation-banner").then((mod) => ({ default: mod.ImpersonationBanner })),
);

export function LazyClerkProvider({
  fallback = null,
  ...props
}: ComponentProps<typeof ClerkProviderInner> & {
  /** Shown if Clerk's code isn't ready yet. Usually never: on the first load
   * React keeps the server's HTML until it is, and later page changes reuse
   * it. But a server that has only just started can send the page before
   * its own copy has loaded, and then this is what's in the page. */
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <ClerkProviderInner {...props} />
    </Suspense>
  );
}

export function LazySiteUserButton(props: ComponentProps<typeof SiteUserButtonInner>) {
  return (
    <Suspense fallback={<AvatarPlaceholder imageUrl={props.imageUrl} initial={props.initial} />}>
      <SiteUserButtonInner {...props} />
    </Suspense>
  );
}

export function LazyImpersonationBanner(props: ComponentProps<typeof ImpersonationBannerInner>) {
  return (
    <Suspense fallback={null}>
      <ImpersonationBannerInner {...props} />
    </Suspense>
  );
}

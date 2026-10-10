"use client";

import { lazy, Suspense, type ComponentProps } from "react";
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

export function LazyClerkProvider(props: ComponentProps<typeof ClerkProviderInner>) {
  return (
    // No fallback needed in practice: on the first load React keeps the
    // server's HTML until this is ready, and later page changes reuse it.
    <Suspense fallback={null}>
      <ClerkProviderInner {...props} />
    </Suspense>
  );
}

export function LazySiteUserButton(props: ComponentProps<typeof SiteUserButtonInner>) {
  return (
    <Suspense
      fallback={<AvatarPlaceholder image={props.image} initial={props.initial} />}
    >
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

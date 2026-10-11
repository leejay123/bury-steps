import { Suspense, ViewTransition, type ReactNode } from "react";

/**
 * A Suspense boundary whose placeholder, when it was on screen, hands over
 * to the real content with the skeleton reveal: the placeholder fades out as
 * the content fades in and sharpens (.skeleton-reveal in globals.css).
 *
 * The <ViewTransition> sits outside the Suspense boundary, so React treats
 * placeholder → content as an "update" and cross-fades the two. It does
 * nothing else (default="none"): a page that arrives ready — fetched ahead,
 * no placeholder — just appears, with no animation. See
 * https://react.dev/reference/react/ViewTransition and
 * node_modules/next/dist/docs/01-app/02-guides/view-transitions.md.
 *
 * Use it only where the fallback is a skeleton; where the fallback is
 * already the real content there's nothing to reveal.
 */
export function RevealSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <ViewTransition default="none" update="skeleton-reveal">
      <Suspense fallback={fallback}>{children}</Suspense>
    </ViewTransition>
  );
}

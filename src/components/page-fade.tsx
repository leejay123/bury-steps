"use client";

import { ViewTransition, type ReactNode } from "react";

/**
 * Crossfades the page content on navigation — the browser's own view
 * transition crossfade, no custom timing. The old and new page blend in one
 * layer rather than one fading out and the other fading in separately
 * (which left a blank flash between them). Skeletons crossfade into the
 * loaded content the same way. The header sits outside and stays still.
 */
export function PageFade({ children }: { children: ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}

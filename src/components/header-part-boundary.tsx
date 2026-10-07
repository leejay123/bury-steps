"use client";

import { Component, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";

/**
 * Keeps one broken piece of the site's frame (header, footer, phone menu)
 * from taking the whole page down. Those pieces sit in the root layout, so
 * without this an error in, say, the account menu skipped every page's own
 * error screen and showed the bare "Something went wrong" page instead.
 * The piece is swapped for `fallback` (nothing by default); the rest of the
 * page carries on. A fresh page load tries the piece again.
 */
export class HeaderPartBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; name: string },
  { error: unknown; failed: boolean }
> {
  state = { error: null as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[header-part:${this.props.name}]`, error);
  }

  render() {
    if (this.state.failed) {
      // A redirect or "not found" isn't a crash: let Next.js handle it.
      unstable_rethrow(this.state.error);
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

"use client";

/**
 * Catches a render-time crash from the map (a failed chunk download, an
 * exception thrown while MapLibre parses a style) and shows a plain
 * message instead of taking the rest of the walk page down with it. Not
 * used for ordinary map problems — those are caught and shown inline by
 * the map component itself (see route-map-view-impl.tsx's own error
 * state) — only for something that actually throws during render.
 */

import { Component, type ReactNode } from "react";

export class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Route map failed to render:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default MapErrorBoundary;

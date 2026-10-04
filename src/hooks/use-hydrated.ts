"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and while React hydrates the server's HTML, true
 * straight after (and on every later mount). For text that depends on the
 * moment it's drawn — a seconds countdown, say — render the time-free
 * version until this is true, so the browser's first pass matches the HTML
 * the server sent instead of failing hydration (React error #418).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

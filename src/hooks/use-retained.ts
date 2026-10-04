"use client";

import { useState } from "react";

/**
 * The latest non-null `value`, kept after it goes back to null — so a drawer
 * that stays mounted while closed still has its last item to show during
 * the close slide. Stored in state (the React-docs "storing information from
 * previous renders" pattern) rather than a ref read during render.
 *
 * `value` must keep the same identity between renders while it's the same
 * item (e.g. found in a props array or a module constant), or this would
 * re-render on every pass.
 */
export function useRetained<T>(value: T | null): T | null {
  const [retained, setRetained] = useState(value);
  if (value !== null && !Object.is(value, retained)) setRetained(value);
  return value ?? retained;
}

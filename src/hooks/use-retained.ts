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

/**
 * For a drawer opened on an item (or in "add" mode) and closed by setting it
 * back to null: `shown` keeps the last item while the drawer slides shut, so
 * its title and fields don't blank out or switch to the "Add" wording on the
 * way out. `session` goes up each time it's opened on a new value — key the
 * form on it so every opening starts fresh, not with whatever was typed and
 * cancelled last time.
 */
export function useRetainedItem<T>(value: T | null): { shown: T | null; session: number } {
  const [state, setState] = useState({ retained: value, session: 0 });
  if (value !== null && !Object.is(value, state.retained)) {
    setState({ retained: value, session: state.session + 1 });
  }
  return { shown: value ?? state.retained, session: state.session };
}

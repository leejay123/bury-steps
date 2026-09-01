"use client";

import { useState } from "react";

/**
 * Runs `apply` synchronously during render whenever any value in `deps`
 * changes (shallow-compared, same semantics as a useEffect dependency
 * array) — the React-docs "adjusting state when a prop changes" pattern
 * (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes),
 * generalized to N dependencies.
 *
 * Prefer this over `useEffect(apply, deps)` when `apply` only calls
 * setState: it lands in the same render pass instead of committing a stale
 * frame first, and it satisfies react-hooks/set-state-in-effect. `apply`
 * must stay a pure state adjustment — side effects like toasts or network
 * calls still belong in a real useEffect alongside it, keyed on the same
 * deps.
 */
export function useResetOnChange(deps: readonly unknown[], apply: () => void) {
  const [prevDeps, setPrevDeps] = useState(deps);
  const changed =
    deps.length !== prevDeps.length || deps.some((dep, index) => !Object.is(dep, prevDeps[index]));
  if (changed) {
    setPrevDeps(deps);
    apply();
  }
}

import type { Ref, RefCallback } from "react";

/**
 * Combines several refs (a forwarded ref prop plus any number of internal
 * refs) into one callback ref, so a component can hand its DOM node to all
 * of them at once.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | null | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

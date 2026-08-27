"use client";

import { createContext, useContext } from "react";

/** Drawer, dialog, and alert dialog set this so dropdowns open inside them. */
export const OverlayRootContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot() {
  return useContext(OverlayRootContext);
}

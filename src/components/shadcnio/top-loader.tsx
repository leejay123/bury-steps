"use client";

import type { ReactNode } from "react";
import { ProgressProvider } from "@bprogress/next/app";

/**
 * shadcn.io's top loading bar (they use BProgress): a 2px line in the page's
 * main colour, with a soft glow at its tip, across the very top while the
 * next page loads.
 */
export function TopLoader({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider color="var(--primary)" height="2px" options={{ showSpinner: false }} shallowRouting>
      {children}
    </ProgressProvider>
  );
}

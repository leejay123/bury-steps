"use client";

import { createContext, useContext, useEffect } from "react";

/**
 * The last step of the top bar's breadcrumb (Walks › this walk): a page
 * names itself with <HeaderCrumb title="…" />, and the top bar (site-shell.tsx)
 * shows it. Gone again when the page is left.
 */
export const SetPageCrumb = createContext<(title: string | null) => void>(() => {});

export function HeaderCrumb({ title }: { title: string }) {
  const set = useContext(SetPageCrumb);
  useEffect(() => {
    set(title);
    return () => set(null);
  }, [set, title]);
  return null;
}

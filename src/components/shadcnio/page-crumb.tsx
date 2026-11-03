"use client";

import { createContext, useContext, useEffect } from "react";

export type PageCrumb = {
  title: string;
  /** Extra steps before this page (Walks › History › this walk). */
  trail?: { href: string; label: string }[];
};

/**
 * The last step of the top bar's breadcrumb (Walks › this walk): a page
 * names itself with <HeaderCrumb title="…" />, and the top bar (site-shell.tsx)
 * shows it. Gone again when the page is left.
 */
export const SetPageCrumb = createContext<(crumb: PageCrumb | null) => void>(() => {});

export function HeaderCrumb({ title, trail }: { title: string; trail?: PageCrumb["trail"] }) {
  const set = useContext(SetPageCrumb);
  const trailKey = trail?.map((step) => `${step.href}\0${step.label}`).join("\n") ?? "";
  useEffect(() => {
    set({
      title,
      trail: trailKey
        ? trailKey.split("\n").map((line) => {
            const [href, label] = line.split("\0");
            return { href, label };
          })
        : undefined,
    });
    return () => set(null);
  }, [set, title, trailKey]);
  return null;
}

"use client";

import Link from "next/link";
import { useSiteDesign } from "@/components/site-design-context";

/**
 * Way back to the Walks list in the Original design. The shadcn.io design
 * puts Walks › this walk (or Walks › History › this walk) in the top bar,
 * so this renders nothing there.
 */
export function WalksBackLink({
  href = "/admin/walks",
  label = "All walks",
}: {
  href?: string;
  label?: string;
}) {
  const design = useSiteDesign();
  if (design === "shadcnio") return null;
  return (
    <Link className="text-sm text-muted-foreground hover:text-foreground" data-walks-back="" href={href}>
      &larr; {label}
    </Link>
  );
}

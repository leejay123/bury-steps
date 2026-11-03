"use client";

import Link from "next/link";
import { useSiteDesign } from "@/components/site-design-context";

/**
 * Way back to the Members list in the Original design. The shadcn.io design
 * puts Members › this person in the top bar (site-shell.tsx), so this
 * renders nothing there.
 */
export function MembersBackLink() {
  const design = useSiteDesign();
  if (design === "shadcnio") return null;
  return (
    <Link className="text-sm text-muted-foreground hover:text-foreground" data-members-back="" href="/admin/members">
      &larr; All members
    </Link>
  );
}

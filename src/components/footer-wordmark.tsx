"use client";

import { usePathname } from "next/navigation";
import { TextHoverEffect } from "@/components/velora/text-hover-effect";
import { PAGE_X } from "@/lib/page-x";

/** Giant outlined site name at the foot of the homepage only (the footer
 * itself is shared by every page, so the path decides). */
export function FooterWordmark() {
  if (usePathname() !== "/") return null;

  return (
    <div aria-hidden className={`overflow-hidden ${PAGE_X}`}>
      <TextHoverEffect
        className="mx-auto -mb-[2%] max-w-6xl font-black tracking-tight"
        strokeWidth={0.6}
        text="Bury Steps"
      />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PAGE_X } from "@/lib/page-x";

/**
 * Admins spend most of their time in the app's tools (walks, members,
 * settings, …) where a newsletter signup card is just noise — they only see
 * it on the homepage. Everyone else (members, guests) sees it on every page,
 * since the footer is the one place it's guaranteed to be visible.
 *
 * Owns its own wrapper and bottom divider so there's never a stray border
 * line left behind when the card itself is hidden.
 */
export function NewsletterFooterGate({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  if (isAdmin && !isHomepage) return null;

  return (
    <div className="relative">
      <div className={PAGE_X}>
        <NewsletterSignup />
      </div>
      <FullWidthDivider position="bottom" />
    </div>
  );
}

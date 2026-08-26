"use client";

import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { FACEBOOK_GROUP_URL } from "@/lib/urls";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <nav
        aria-label="Footer"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-4 text-xs text-muted-foreground md:justify-between md:px-6"
      >
        <Link href="/privacy-policy" className="whitespace-nowrap hover:text-foreground">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="whitespace-nowrap hover:text-foreground">
          Terms of Service
        </Link>
        <span aria-hidden className="hidden h-px min-w-4 flex-1 sm:block" />
        <a
          className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-foreground"
          href={FACEBOOK_GROUP_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Facebook aria-hidden className="size-3.5" />
          Facebook group
        </a>
      </nav>
    </footer>
  );
}

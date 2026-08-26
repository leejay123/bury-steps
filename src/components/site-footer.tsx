"use client";

import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { FadeIn } from "@/components/motion";
import { FACEBOOK_GROUP_URL } from "@/lib/urls";

export function SiteFooter() {
  return (
    <FadeIn>
    <footer className="relative">
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
        <span className="hidden h-px min-w-4 flex-1 sm:block" aria-hidden />
        <a
          href={FACEBOOK_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-foreground"
        >
          <Facebook className="size-3.5" aria-hidden />
          Facebook group
        </a>
      </nav>
    </footer>
    </FadeIn>
  );
}

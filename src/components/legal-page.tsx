import type { ReactNode } from "react";
import Link from "next/link";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { Skeleton } from "@/components/ui/skeleton";
import { typesetFont } from "@/app/typeset-font";

export const LEGAL_LAST_UPDATED = "28 August 2026";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

function LegalBody({ children }: { children: ReactNode }) {
  return (
    <div className={`typeset typeset-docs max-w-[90ch] ${typesetFont.variable}`}>
      {children}
    </div>
  );
}

export function LegalPage({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <div className={`-mt-6 -mb-6 flex flex-1 flex-col ${PAGE_X_BLEED}`}>
      <div className="relative px-4 py-6 md:px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-semibold text-lg tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      {/*
        Every section is always shown — no accordion. A short, plain-English
        notice like this one is small enough that hiding most of it behind
        click-to-expand rows just left the page looking empty on load;
        showing it all keeps the exact same section styling (heading, the
        border between rows) without the interactivity.
      */}
      <div className="flex flex-1 flex-col">
        {sections.map((section) => (
          // scroll-mt clears the sticky header so a footer anchor link
          // (e.g. /privacy-policy#cookies) lands with the heading visible,
          // not tucked underneath it — same convention as home-welcome.tsx.
          <div className="scroll-mt-20 border-b px-4 md:px-6" id={section.id} key={section.id}>
            <h2 className="pt-6 pb-2 text-base font-medium">{section.title}</h2>
            <div className="pb-7">
              <LegalBody>{section.content}</LegalBody>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-auto px-4 py-4 md:px-6 text-xs text-muted-foreground">
        This page is a practical notice for Bury Steps members. It is not legal advice.{" "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/privacy-policy">
          Privacy Policy
        </Link>
        {" · "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/terms-of-service">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}

/** Loading state in the exact shape of LegalPage: title block, then bordered sections. */
export function LegalPageSkeleton() {
  return (
    <div className={`-mt-6 -mb-6 flex flex-1 flex-col ${PAGE_X_BLEED}`}>
      <div className="relative px-4 py-6 md:px-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      <div className="flex flex-1 flex-col">
        {[4, 3, 5, 3].map((lines, index) => (
          <div className="border-b px-4 md:px-6" key={index}>
            <Skeleton className="mt-6 mb-3 h-4 w-36" />
            <div className="flex max-w-[90ch] flex-col gap-2 pb-7">
              {Array.from({ length: lines }, (_, line) => (
                <Skeleton className={line === lines - 1 ? "h-3.5 w-2/3" : "h-3.5 w-full"} key={line} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

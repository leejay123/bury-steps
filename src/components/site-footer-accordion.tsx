"use client";

import type * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PAGE_X } from "@/lib/page-x";

type FooterAccordionSection = {
  title: string;
  icon: React.ReactNode;
  links: React.ReactNode;
};

/**
 * Mobile-only accordion version of the footer's Explore/About/Legal
 * columns — the plain expanded columns (site-footer.tsx's FooterColumn)
 * stay for sm+ via `hidden sm:grid`; this renders instead below that,
 * hidden again above sm, so exactly one of the two is ever visible.
 */
export function SiteFooterAccordion({ sections }: { sections: FooterAccordionSection[] }) {
  return (
    <Accordion className="sm:hidden" collapsible type="single">
      {sections.map((section) => (
        <AccordionItem key={section.title} value={section.title}>
          <AccordionTrigger className={PAGE_X}>
            <span className="flex items-center gap-2 [&>svg]:size-3.5 [&>svg]:shrink-0">
              {section.icon}
              {section.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className={`flex flex-col gap-4 ${PAGE_X}`}>{section.links}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

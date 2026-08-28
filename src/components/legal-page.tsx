import type { ReactNode } from "react";
import Link from "next/link";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PAGE_X_BLEED } from "@/lib/page-x";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const LEGAL_LAST_UPDATED = "25 August 2026";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

function LegalBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:mt-1.5 [&_ol]:flex [&_ol]:flex-col [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:pl-5">
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
    <div className={`-mt-6 -mb-6 flex flex-col ${PAGE_X_BLEED}`}>
      <div className="relative px-4 py-6 md:px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-semibold text-lg tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      <Accordion className="w-full" collapsible defaultValue={sections[0]?.id} type="single">
        {sections.map((section) => (
          <AccordionItem className="px-4 md:px-6" key={section.id} value={section.id}>
            <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
            <AccordionContent>
              <LegalBody>{section.content}</LegalBody>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="px-4 py-4 md:px-6 text-xs text-muted-foreground">
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

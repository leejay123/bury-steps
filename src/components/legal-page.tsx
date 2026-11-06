import type { ReactNode } from "react";
import { ShadcnLegal, type ShadcnLegalDocs, type ShadcnLegalIcon } from "@/components/shadcnio/legal";

export const LEGAL_LAST_UPDATED = "28 August 2026";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalShadcnProps = {
  current: string;
  icon: ShadcnLegalIcon;
  lead: string;
  rest: string;
  /** Null hides "Last updated" (the guide pages); left out, the policies' date. */
  updated?: string | null;
  closing?: string;
  docs?: ShadcnLegalDocs;
};

export async function LegalPage({
  title,
  sections,
  shadcn,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
  /** When set, used as-is for the shadcn.io layout (About, or overrides). */
  shadcn?: LegalShadcnProps;
}) {
  const terms = title.toLowerCase().includes("terms");
  const props: LegalShadcnProps = shadcn ?? {
    current: terms ? "/terms-of-service" : "/privacy-policy",
    icon: terms ? "terms" : "privacy",
    lead: terms ? "The rules for using Bury Steps:" : "How Bury Steps uses your information:",
    rest: terms
      ? "your account, walks and your safety, acceptable use, and our responsibilities."
      : "what we collect, why we need it, who can see it, and your rights.",
  };
  return (
    <ShadcnLegal
      closing={props.closing}
      current={props.current}
      docs={props.docs}
      icon={props.icon}
      lead={props.lead}
      rest={props.rest}
      sections={sections}
      title={title}
      updated={props.updated === undefined ? LEGAL_LAST_UPDATED : props.updated}
    />
  );
}

/** The policy shows when it is ready. No grey stand-in. */
export function LegalPageSkeleton() {
  return null;
}

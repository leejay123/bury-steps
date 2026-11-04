import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { STEPS } from "@/components/shadcnio/home";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Bury Steps works, from making an account to clocking out at the end of a walk.",
};

/** The homepage's How it works steps, one numbered section each. */
export default function HowItWorksPage() {
  return (
    <LegalPage
      description="How Bury Steps works, from making an account to clocking out at the end of a walk."
      sections={STEPS.map((step, i) => ({
        id: `step-${i + 1}`,
        title: step.title,
        content: <p>{step.sub}.</p>,
      }))}
      shadcn={{
        closing: "Come for a walk — everyone is welcome.",
        current: "/how-it-works",
        docs: "guide",
        icon: "how",
        lead: "Joining is free.",
        rest: "Make an account, pick a walk and meet us there. Here is how it all works, step by step.",
        updated: null,
      }}
      title="How it works"
    />
  );
}

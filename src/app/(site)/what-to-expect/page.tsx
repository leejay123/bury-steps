import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteTheme } from "@/lib/site-theme";

export const metadata: Metadata = {
  title: "What to expect",
  description: "A friendly, welcoming walking group for every age and every pace.",
};

/** The homepage's What you can expect list (Settings → Site wording), in full. */
export default async function WhatToExpectPage() {
  const theme = await getSiteTheme();
  return (
    <LegalPage
      description="A friendly, welcoming walking group for every age and every pace."
      sections={[
        {
          id: "expect",
          title: theme.aboutExpectHeading,
          content: (
            <ul>
              {theme.aboutExpect.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ),
        },
      ]}
      shadcn={{
        closing: "Come for a walk — everyone is welcome.",
        current: "/what-to-expect",
        docs: "guide",
        icon: "expect",
        lead: "A friendly, welcoming group",
        rest: "for every age and every pace. No pressure, no judgement, just good company on the paths.",
        updated: null,
      }}
      title="What to expect"
    />
  );
}

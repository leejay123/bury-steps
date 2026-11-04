import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteTheme } from "@/lib/site-theme";

export const metadata: Metadata = {
  title: "Group rules",
  description: "The simple rules that keep Bury Steps friendly and safe.",
};

/** The group rules (Settings → Site wording, also on About), one section each. */
export default async function GroupRulesPage() {
  const theme = await getSiteTheme();
  return (
    <LegalPage
      description="The simple rules that keep Bury Steps friendly and safe."
      sections={theme.aboutRules.map((rule, i) => ({
        id: `rule-${i + 1}`,
        title: rule.title,
        content: <p>{rule.body}</p>,
      }))}
      shadcn={{
        closing: "Questions about a rule? Ask us.",
        current: "/group-rules",
        docs: "guide",
        icon: "rules",
        lead: "A few simple rules",
        rest: "that keep the group kind, safe and welcoming for everyone.",
        updated: null,
      }}
      title="Group rules"
    />
  );
}

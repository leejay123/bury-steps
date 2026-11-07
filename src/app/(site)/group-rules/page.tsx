import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";
import { getSiteTheme } from "@/lib/site-theme";

export const metadata: Metadata = {
  title: "Group rules",
  description: "The simple rules that keep Bury Steps friendly and safe.",
};

/** Why the group has rules, the rules themselves (Settings → Site wording, also on About) and the safety basics. */
export default async function GroupRulesPage() {
  const theme = await getSiteTheme();
  return (
    <DesignedSitePage page="groupRules">
    <LegalPage
      description="The simple rules that keep Bury Steps friendly and safe."
      sections={[
        {
          id: "why",
          title: "Why we have rules",
          content: (
            <>
              <p>
                Bury Steps works because everyone looks out for each other. These few simple rules aren’t there to
                tell anyone off — they’re what keeps the group kind, safe and welcoming, so that everyone wants to
                come back next time.
              </p>
              <p>By coming on a walk, you agree to follow them. Most of them are just good manners.</p>
            </>
          ),
        },
        {
          id: "rules",
          title: theme.aboutRulesHeading,
          content: (
            <ul>
              {theme.aboutRules.map((rule) => (
                <li key={rule.title}>
                  <strong>{rule.title}.</strong> {rule.body}
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: "safety",
          title: "Staying safe on a walk",
          content: (
            <>
              <p>
                Walks are outdoors, and paths, weather and fitness all vary. You take part at your own risk, so only
                come if you feel well enough on the day. Clock in when you arrive and clock out when you leave, even
                if you leave early, so the leader always knows who is still on the walk.
              </p>
              <p>
                Follow the walk leader’s instructions, take care near roads, rivers and steep ground, and keep the
                group in sight. If you feel unwell or need to stop, tell a leader straight away — nobody will mind.
              </p>
            </>
          ),
        },
        {
          id: "countryside",
          title: "Looking after the countryside",
          content: (
            <>
              <p>
                Leave gates as you find them, stick to the paths, and take your litter home. Be friendly to the
                people we pass and to the farmers and landowners whose land we walk through.
              </p>
              <p>
                Dogs are welcome on walks marked as dog friendly. Keep them under control, on a lead near livestock
                and wildlife, and always clear up after them.
              </p>
            </>
          ),
        },
        {
          id: "problems",
          title: "If something goes wrong",
          content: (
            <>
              <p>
                If there’s an accident or anyone is hurt, tell a walk leader at once. The organisers keep a record of
                anything that happens on a walk, so it can be looked after properly and learned from.
              </p>
              <p>
                If something has upset you, or you’re worried about anything in the group, please{" "}
                <Link href="/contact">get in touch</Link>. An organiser will listen and help.
              </p>
            </>
          ),
        },
      ]}
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
    </DesignedSitePage>
  );
}

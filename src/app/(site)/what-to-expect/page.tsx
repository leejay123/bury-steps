import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";
import { getSiteTheme } from "@/lib/site-theme";

export const metadata: Metadata = {
  title: "What to expect",
  description: "A friendly, welcoming walking group for every age and every pace.",
};

/** What a walk with the group is like, with the What you can expect list (Settings → Site wording). */
export default async function WhatToExpectPage() {
  const theme = await getSiteTheme();
  return (
    <DesignedSitePage page="whatToExpect">
    <LegalPage
      description="A friendly, welcoming walking group for every age and every pace."
      sections={[
        {
          id: "welcome",
          title: "A friendly welcome",
          content: (
            <>
              <p>
                Bury Steps is a friendly, welcoming group for every age and every pace. Whether it’s your first walk
                in years or you’re out every weekend, you’ll be made to feel at home from the moment you arrive.
              </p>
              <p>
                There’s no pressure and no judgement. Nobody minds how fast you walk, how far you go, or how fit you
                are. What matters is that you came.
              </p>
            </>
          ),
        },
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
        {
          id: "on-the-day",
          title: "On the day",
          content: (
            <>
              <p>
                Get to the meeting point a few minutes early and look out for the group. Clock in on your phone when
                you arrive, so the walk leader knows you’re there. If you’re new, say hello — someone will happily
                walk with you and show you the ropes.
              </p>
              <p>
                The leader will set off once everyone is ready. The walk goes at a comfortable pace, with time to
                chat, catch your breath and enjoy the views. If you need to leave early, just clock out as you go.
              </p>
            </>
          ),
        },
        {
          id: "who",
          title: "Who walks with us",
          content: (
            <>
              <p>
                The group suits beginners and people getting back into exercise, as well as regular walkers. Many of
                our members are middle-aged or older, but everyone is welcome, and plenty of people come along on
                their own.
              </p>
              <p>
                People walk with us for all sorts of reasons: to get fitter, to feel better, to get outdoors, or
                simply to meet new people. You’ll find something here whatever your reason.
              </p>
            </>
          ),
        },
        {
          id: "first-step",
          title: "Taking the first step",
          content: (
            <>
              <p>
                Joining a new group can feel daunting. You don’t have to have it all figured out — come as you are.
                Have a look at the <Link href="/walks">walks coming up</Link>, read{" "}
                <Link href="/how-it-works">how it works</Link>, and pick one that suits you.
              </p>
              <p>
                Have a question first? <Link href="/contact">Get in touch</Link> and an organiser will get back to you.
              </p>
            </>
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
    </DesignedSitePage>
  );
}

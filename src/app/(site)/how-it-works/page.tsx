import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Bury Steps works, from making an account to clocking out at the end of a walk.",
};

/** The homepage's How it works steps (home.tsx STEPS), each explained in full. */
export default function HowItWorksPage() {
  return (
    <DesignedSitePage page="howItWorks">
    <LegalPage
      description="How Bury Steps works, from making an account to clocking out at the end of a walk."
      sections={[
        {
          id: "account",
          title: "Create an account",
          content: (
            <>
              <p>
                Joining is free and takes about a minute. <Link href="/sign-up">Sign up</Link> with your email
                address or your Google account, add your name, and that’s it — you’re part of the group.
              </p>
              <p>
                Your account is what lets you clock in on a walk, read the organisers’ notices and keep a record of
                the walks you’ve been on. You choose which emails you get, and you can change that at any time in
                your email preferences.
              </p>
            </>
          ),
        },
        {
          id: "walks",
          title: "See the walks",
          content: (
            <>
              <p>
                Every walk coming up is on the <Link href="/walks">Walks</Link> page, soonest first. Open one to see
                everything you need before you go: the day and time, where to meet, a map, how long and how hilly
                the route is, and what’s there on the day, such as toilets, parking or a café.
              </p>
              <p>
                Each meeting point has a map pin and a what3words address, so you can find the exact spot even in a
                big car park. Walks can be shared with a link, so you can send one to a friend who’d like to come
                along.
              </p>
            </>
          ),
        },
        {
          id: "clock-in",
          title: "Clock in on the day",
          content: (
            <>
              <p>
                When you arrive at the meeting point, open the walk on your phone and clock in. It takes a few
                seconds and tells the walk leader you’re there, so nobody is counted twice or left behind.
              </p>
              <p>
                As you clock in, you confirm that you’re fit to walk that day. You can also add an emergency
                contact, and anything the leader should know about your health. Only the organisers can see these,
                and only so they can help if you need it.
              </p>
            </>
          ),
        },
        {
          id: "pace",
          title: "Walk at your pace",
          content: (
            <>
              <p>
                This isn’t a race. Walk at whatever speed suits you — the group goes at the pace of its walkers, and
                nobody gets left behind. Stop for a breather, chat, take photos, or just enjoy the quiet.
              </p>
              <p>
                The walk leaders know the route and keep an eye on everyone. If you’re unsure about anything on the
                way, just ask one of them.
              </p>
            </>
          ),
        },
        {
          id: "clock-out",
          title: "Clock out when done",
          content: (
            <>
              <p>
                At the end of the walk, clock out on the same page. If you need to leave early, that’s completely
                fine — clock out when you go, so the leader knows you’ve left safely and isn’t waiting for you.
              </p>
              <p>Your walk then shows in your history, whether you stayed for all of it or part of it.</p>
            </>
          ),
        },
        {
          id: "notices",
          title: "Read the notices",
          content: (
            <>
              <p>
                The organisers post news on the <Link href="/notices">Notices</Link> page: changes to a walk, new
                routes, group news and anything to do with safety. Short messages show in the bell at the top of the
                page, and you can choose to get them by email too.
              </p>
              <p>A notice you haven’t read yet is marked New, so nothing important slips past.</p>
            </>
          ),
        },
        {
          id: "progress",
          title: "Watch the miles add up",
          content: (
            <>
              <p>
                The <Link href="/progress">Progress</Link> page shows how the group is walking together this month:
                every clock-in counts towards a shared goal, and people with the same number of walks sit side by
                side. There are no winners or losers — it’s about turning up, not speed or distance.
              </p>
              <p>You’ll also see your own month, year and how many weeks in a row you’ve walked, and earn badges along the way.</p>
            </>
          ),
        },
        {
          id: "history",
          title: "Look back",
          content: (
            <>
              <p>
                Your <Link href="/history">History</Link> keeps every walk you’ve clocked in to, newest first, with
                whether you stayed for the whole walk or left early. Search it by walk or meeting point, or filter it
                to find a particular day.
              </p>
              <p>It’s a nice way to see how far you’ve come since your first step with the group.</p>
            </>
          ),
        },
      ]}
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
    </DesignedSitePage>
  );
}

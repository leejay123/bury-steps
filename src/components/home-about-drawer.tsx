"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FACEBOOK_GROUP_URL } from "@/lib/urls";

const GOALS = [
  "Lose weight",
  "Improve your fitness and mobility",
  "Build confidence",
  "Improve your mental wellbeing",
  "Meet new people and make friends",
  "Enjoy fresh air and local scenery",
  "Get back into exercise after a break",
  "Feel less isolated",
  "Create healthier habits",
  "Spend a few hours in good company on a Sunday afternoon",
];

const PLACES = [
  "Country parks",
  "Riverside paths",
  "Woodland trails",
  "Nature reserves",
  "Scenic local routes",
  "Gentle rambles suitable for beginners",
];

const EXPECT = [
  "Friendly and welcoming atmosphere",
  "Open to all",
  "Particularly suited to middle-aged and older adults, although everyone is welcome",
  "Ideal for beginners and those returning to exercise",
  "No pressure and no judgement",
  "Walk at your own pace",
  "Encouragement rather than competition",
  "Supportive conversations and shared experiences",
  "Opportunities to make genuine friendships",
  "A focus on wellbeing, enjoyment and community",
];

const RULES = [
  {
    title: "Respect every walker",
    body: "Kindness first, always. Everyone’s pace, story and ability deserve equal respect.",
  },
  {
    title: "Walk at your own pace",
    body: "No pressure to keep up or slow down. Enjoy the rhythm that suits you.",
  },
  {
    title: "Keep conversations positive",
    body: "Share laughs, ideas and support. Avoid gossip or negativity.",
  },
  {
    title: "Listen to the walk leaders",
    body: "They are there to keep everyone safe and on track.",
  },
  {
    title: "Stay safe and aware",
    body: "Mind paths, rivers and roads. Look out for one another.",
  },
  {
    title: "No judgement, no pressure",
    body: "Whether you are chatty or quiet, fast or steady, you belong.",
  },
  {
    title: "Respect nature and locals",
    body: "Leave no litter, greet passers-by, and keep dogs under control.",
  },
  {
    title: "Keep it inclusive",
    body: "All ages, backgrounds and fitness levels are welcome.",
  },
  {
    title: "Share ideas for walks",
    body: "The walks belong to all of us. Every member has something to contribute.",
  },
  {
    title: "Enjoy yourself",
    body: "Fresh air, good company and better days are what we are here for.",
  },
] as const;

function BulletList({ items, columns = false }: { items: string[]; columns?: boolean }) {
  return (
    <ul className={columns ? "grid gap-1.5 sm:grid-cols-2" : "space-y-1.5"}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function HomeAboutDrawer({ trigger }: { trigger?: ReactNode }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger ?? <Button variant="outline">Read more</Button>}
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-2xl">
        <DrawerHeader className="shrink-0 border-b text-left">
          <DrawerTitle>About Bury Steps</DrawerTitle>
          <DrawerDescription>
            How the group started, what to expect, and a few simple rules.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5">
          <article className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">How this started</h3>
              <p>
                What started out as a self-help mission to get myself fit after my diabetes
                diagnosis began with a simple goal: walking four miles a day with the dogs after
                work. I lost a fair bit of weight and was incredibly proud of myself.
              </p>
              <p>
                Then an unexpected death in the family knocked everyone sideways. I found myself
                thinking, &ldquo;Why should I bother when someone as fit as my brother-in-law could
                die without any warning, without any indication that he was ill?&rdquo;
              </p>
              <p>So I gave up the long walks.</p>
              <p>The weight piled back on, and then some.</p>
              <p>
                Later, I had a routine appointment with my doctor, which led to blood tests, urine
                tests, and stool tests. When the results came back, there seemed to be so many
                things wrong with me.
              </p>
              <p>It was time to start working on my fitness again.</p>
              <p>
                I knew that if I wanted to get back into walking, I wouldn&apos;t have the
                motivation to do it on my own. So I put a message out on Facebook asking if anyone
                would be interested in walking as a group.
              </p>
              <p>I was inundated with messages.</p>
              <p>
                I set up a Facebook group and asked AI for a good name. Bury Steps Walking Group was
                born.
              </p>
              <p>
                After just a couple of weeks, well over 100 people had joined the Facebook group.
                Encouraged by the response, I decided to take the plunge and create our first
                event: a nice, gentle, flat walk along Tottington Lines, an old railway track that
                had been transformed into a countryside walking route.
              </p>
              <p>
                I first took out public liability insurance for the group, then discovered I also
                needed a health and safety policy, a mission statement, a constitution, sign-in
                sheets, incident report forms, and risk assessments. It was far more work than I had
                anticipated.
              </p>
              <p>
                But at the front of my mind was the reason I had started all of this in the first
                place: I had to do something for myself.
              </p>
              <p>So I carried on and got everything organised.</p>
              <p>Onwards to Walk Number One.</p>
              <p>
                Fourteen people joined me on that first walk. Fourteen people I had never met
                before. Fourteen people who got on with each other like a house on fire.
              </p>
              <p>&ldquo;This could be big,&rdquo; I thought to myself.</p>
              <p>So I arranged another walk.</p>
              <p>
                Now, just three months in, we have more than 200 members in our Facebook group, with
                around 20 regular walkers joining us week after week.
              </p>
              <p>
                Recently, I was contacted by Bury Council&apos;s Live Well Team and asked whether I
                would be willing to affiliate the group with them. Absolutely. It was a complete
                no-brainer.
              </p>
              <p>
                I am incredibly proud that my efforts, combined with the cooperation and enthusiasm
                of all our walkers, have paid off and are becoming something bigger and far more
                effective than I ever imagined.
              </p>
              <p>
                What started as a personal mission to improve my own health has grown into something
                that could make a real difference to so many people.
              </p>
              <p>
                To me, that is what Bury Steps is all about: ensuring that everyone feels welcome,
                supported, and able to take those first steps towards improving their health and
                wellbeing.
              </p>
              <p>
                I would like to thank each and every one of our members for being part of this
                journey. I know it can be a bit of a nuisance having to sign in at every walk, but
                this is one of the requirements set by our insurers.
              </p>
              <p>
                Please bear with me. I am currently working on ways to make the process as simple
                and straightforward as possible for everyone.
              </p>
              <p>
                What began as a walk for my own health has become a community. A place where
                friendships are formed, confidence is built, and people support one another to
                become healthier and happier versions of themselves.
              </p>
              <p>
                Thank you all for helping make Bury Steps Walking Group what it is today.
              </p>
              <p>Onwards and upwards to bigger and better things.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">More than just a walking group</h3>
              <p>
                Bury Steps was never created as a fitness club or a competition. There are no
                winners and losers here. Nobody cares how fast you walk, how far you walk, what
                fitness level you are at, or whether you are just starting out after years of
                inactivity.
              </p>
              <p>
                This group is about supporting each other, enjoying the outdoors, improving our
                physical and mental wellbeing, and proving that positive change often begins with
                one small step.
              </p>
              <p>Whether your goal is to:</p>
              <BulletList items={GOALS} columns />
              <p>…you will find a warm welcome here.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">What we do</h3>
              <p>
                The idea is simple. We meet on Sunday afternoons and explore different walks
                suggested by members.
              </p>
              <BulletList items={PLACES} columns />
              <p>
                Everyone is encouraged to share ideas and help shape the group. The walks belong to
                all of us, and every member has something valuable to contribute.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">What you can expect</h3>
              <BulletList items={EXPECT} />
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Taking the first step</h3>
              <p>
                Joining a new group can feel daunting. Many of us know what it is like to sit at
                home wondering whether to come along, worrying about whether we will fit in, keep
                up, or know anyone.
              </p>
              <p>
                You do not have to have it all figured out. Come as you are. Chat, photos and
                last-minute updates also live in our{" "}
                <a
                  href={FACEBOOK_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Facebook group
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Group rules</h3>
              <div className="grid gap-3">
                {RULES.map((rule) => (
                  <Card key={rule.title} className="gap-2 py-4 shadow-none">
                    <CardHeader className="gap-1">
                      <CardTitle className="text-sm">{rule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{rule.body}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </article>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

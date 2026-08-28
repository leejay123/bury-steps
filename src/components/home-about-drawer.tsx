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
  "Open to both men and women",
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
                Just eight weeks ago, in June, I was struggling to find the motivation to get out
                and start walking. Not because I did not want to improve my health, but because I
                simply could not find the motivation to do it alone.
              </p>
              <p>What happened next completely changed my life.</p>
              <p>
                Within hours of taking that first step, I created this walking group with no
                expectations and no idea what it would become.
              </p>
              <p>
                Eight weeks later, I can honestly say it has been one of the best decisions I have
                ever made. Not only has my health improved, but I have met some truly wonderful
                people along the way. I have shared countless walks, conversations, laughs, stories
                and moments of encouragement with people from all walks of life. What started as a
                personal challenge has grown into a supportive community built on kindness,
                friendship and mutual encouragement.
              </p>
              <p>
                For that, I will be forever grateful to every single member who has joined us so
                far.
              </p>
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

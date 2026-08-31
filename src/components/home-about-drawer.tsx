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
import {
  DEFAULT_ABOUT_EXPECT,
  DEFAULT_ABOUT_GOALS,
  DEFAULT_ABOUT_PLACES,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_TITLE,
  aboutRulesFromStored,
  howThisStartedParagraphs,
  type AboutRule,
} from "@/lib/homepage-copy";

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

export function HomeAboutDrawer({
  aboutExpect = [...DEFAULT_ABOUT_EXPECT],
  aboutGoals = [...DEFAULT_ABOUT_GOALS],
  aboutPlaces = [...DEFAULT_ABOUT_PLACES],
  aboutRules = aboutRulesFromStored(""),
  facebookGroupUrl = "",
  howThisStartedBody = DEFAULT_HOW_THIS_STARTED_BODY,
  howThisStartedTitle = DEFAULT_HOW_THIS_STARTED_TITLE,
  trigger,
}: {
  aboutExpect?: string[];
  aboutGoals?: string[];
  aboutPlaces?: string[];
  aboutRules?: AboutRule[];
  facebookGroupUrl?: string;
  howThisStartedBody?: string;
  howThisStartedTitle?: string;
  trigger?: ReactNode;
}) {
  const facebookUrl = facebookGroupUrl.trim();
  const storyParagraphs = howThisStartedParagraphs(howThisStartedBody);
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
              <h3 className="text-base font-semibold text-foreground">{howThisStartedTitle}</h3>
              {storyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
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
              <BulletList columns items={aboutGoals} />
              <p>…you will find a warm welcome here.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">What we do</h3>
              <p>
                The idea is simple. We meet on Sunday afternoons and explore different walks
                suggested by members.
              </p>
              <BulletList columns items={aboutPlaces} />
              <p>
                Everyone is encouraged to share ideas and help shape the group. The walks belong to
                all of us, and every member has something valuable to contribute.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">What you can expect</h3>
              <BulletList items={aboutExpect} />
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
                last-minute updates also live in our
                {facebookUrl ? (
                  <>
                    {" "}
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Facebook group
                    </a>
                  </>
                ) : (
                  " Facebook group"
                )}
                .
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Group rules</h3>
              <div className="grid gap-3">
                {aboutRules.map((rule) => (
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

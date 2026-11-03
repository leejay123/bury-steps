import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteTheme } from "@/lib/site-theme";
import { howThisStartedParagraphs } from "@/lib/homepage-copy";

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getSiteTheme();
  return {
    title: theme.howThisStartedTitle || "About",
    description: theme.howThisStartedTeaser,
  };
}

export default async function AboutPage() {
  const theme = await getSiteTheme();
  const story = howThisStartedParagraphs(theme.howThisStartedBody);
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <LegalPage
      description={theme.howThisStartedTeaser}
      sections={[
        {
          id: "story",
          title: theme.howThisStartedTitle,
          content: (
            <>
              {story.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </>
          ),
        },
        {
          id: "goals",
          title: theme.aboutGoalsHeading,
          content: (
            <>
              <p>
                Bury Steps was never created as a fitness club or a competition. There are no winners and losers
                here. Nobody cares how fast you walk, how far you walk, what fitness level you are at, or whether
                you are just starting out after years of inactivity.
              </p>
              <p>
                This group is about supporting each other, enjoying the outdoors, improving our physical and mental
                wellbeing, and proving that positive change often begins with one small step.
              </p>
              <p>Whether your goal is to:</p>
              <ul>
                {theme.aboutGoals.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
              <p>…you will find a warm welcome here.</p>
            </>
          ),
        },
        {
          id: "places",
          title: theme.aboutPlacesHeading,
          content: (
            <>
              <p>The idea is simple. We meet on Sunday afternoons and explore different walks suggested by members.</p>
              <ul>
                {theme.aboutPlaces.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
              <p>
                Everyone is encouraged to share ideas and help shape the group. The walks belong to all of us, and
                every member has something valuable to contribute.
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
          id: "first-step",
          title: "Taking the first step",
          content: (
            <>
              <p>
                Joining a new group can feel daunting. Many of us know what it is like to sit at home wondering
                whether to come along, worrying about whether we will fit in, keep up, or know anyone.
              </p>
              <p>
                You do not have to have it all figured out. Come as you are. Chat, photos and last-minute updates
                also live in our
                {facebookUrl ? (
                  <>
                    {" "}
                    <a href={facebookUrl} rel="noopener noreferrer" target="_blank">
                      Facebook group
                    </a>
                  </>
                ) : (
                  " Facebook group"
                )}
                .
              </p>
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
      ]}
      shadcn={{
        closing: "Come for a walk — everyone is welcome.",
        current: "/about",
        icon: "about",
        lead: "How Bury Steps began,",
        rest: "what to expect on a walk, and the simple rules that keep the group kind.",
      }}
      title={theme.howThisStartedTitle || "About"}
    />
  );
}

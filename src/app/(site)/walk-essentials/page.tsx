import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import { LegalPage } from "@/components/legal-page";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";
import { getSiteTheme } from "@/lib/site-theme";
import { essentialIcon } from "@/lib/walk-essentials";

export const metadata: Metadata = {
  title: "Walk essentials",
  description: "What each walk's page tells you before you set off, and what to bring.",
};

/** The walk essentials list (Settings → Walk essentials) with their icons, and what to bring. */
export default async function WalkEssentialsPage() {
  const theme = await getSiteTheme();
  return (
    <DesignedSitePage page="walkEssentials">
    <LegalPage
      description="What each walk's page tells you before you set off, and what to bring."
      sections={[
        {
          id: "before",
          title: "Know before you go",
          content: (
            <>
              <p>
                Every walk is different. Some start from a car park with a café and toilets; others meet at a
                roadside gate with stiles along the way. So that nothing catches you out, each walk’s page shows
                which of the essentials below apply to that walk.
              </p>
              <p>
                Have a look at the walk before you set off — especially if you’re bringing a dog or a pushchair, or
                coming by bus.
              </p>
            </>
          ),
        },
        {
          id: "essentials",
          title: "On each walk’s page",
          content: (
            <>
              {/* The icons are the markers, so no bullets. */}
              <ul className="list-none ps-0 [&>li]:ps-0 [&>li]:before:hidden [&>li]:marker:content-none">
                {theme.walkEssentials.map((item) => (
                  <li key={item.key}>
                    <span className="inline-flex items-center gap-2">
                      {createElement(essentialIcon(item.icon), { "aria-hidden": true, className: "size-4 shrink-0" })}
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p>Each walk page also shows the distance, how hilly the route is, and where to meet.</p>
            </>
          ),
        },
        {
          id: "bring",
          title: "What to bring",
          content: (
            <>
              <p>
                Comfortable footwear with a good grip matters most — walking boots if the walk recommends them, as
                paths can be muddy or uneven. Dress for the weather in layers, and bring a waterproof if there’s any
                chance of rain.
              </p>
              <ul>
                <li>Water, and a snack on longer walks</li>
                <li>Your phone, charged, to clock in and out</li>
                <li>Any medication you might need</li>
                <li>Sun cream and a hat in summer, gloves and a warm hat in winter</li>
              </ul>
            </>
          ),
        },
        {
          id: "getting-there",
          title: "Getting there",
          content: (
            <>
              <p>
                Each walk’s meeting point has a map pin and a what3words address, so you can find the exact spot.
                The free <Link href="/apps">walking apps</Link> help with directions and with following the route on
                the day.
              </p>
              <p>
                Walks near public transport are marked, and so is parking. If you’re not sure how to get to a walk,{" "}
                <Link href="/contact">ask us</Link>.
              </p>
            </>
          ),
        },
      ]}
      shadcn={{
        closing: "Not sure what to bring? Ask us.",
        current: "/walk-essentials",
        docs: "guide",
        icon: "essentials",
        lead: "Know before you go.",
        rest: "Each walk's page shows what's there on the day: toilets, parking, dogs, stiles and more.",
        updated: null,
      }}
      title="Walk essentials"
    />
    </DesignedSitePage>
  );
}

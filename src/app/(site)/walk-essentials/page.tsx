import type { Metadata } from "next";
import { createElement } from "react";
import { LegalPage } from "@/components/legal-page";
import { getSiteTheme } from "@/lib/site-theme";
import { essentialIcon } from "@/lib/walk-essentials";

export const metadata: Metadata = {
  title: "Walk essentials",
  description: "What each walk's page tells you before you set off: toilets, parking, dogs and more.",
};

/** The walk essentials list (Settings → Walk essentials) with their icons. */
export default async function WalkEssentialsPage() {
  const theme = await getSiteTheme();
  return (
    <LegalPage
      description="What each walk's page tells you before you set off: toilets, parking, dogs and more."
      sections={[
        {
          id: "essentials",
          title: "On each walk's page",
          content: (
            <>
              <p>Every walk shows which of these apply, so you know what to expect before you set off.</p>
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
  );
}

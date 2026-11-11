import type { Metadata } from "next";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";
import { SitePageRender } from "@/components/site-page-designer/render";
import { seedCharityDesign } from "@/lib/site-page-copy";
import { loadSitePageLive } from "@/lib/site-page-seeds";
import { PageKindMark } from "@/components/shadcnio/page-kind";

export const metadata: Metadata = {
  title: "Charity of the Year",
  description: "Shop online through easyfundraising and raise free donations for the Bury Steps Charity of the Year fund.",
};

/**
 * Charity of the Year (easyfundraising). Until it's designed in the page designer,
 * the page is drawn from the designer's own starting blocks (seedCharityDesign),
 * so the designer and the live page always start out the same.
 */
export default async function CharityOfTheYearPage() {
  const live = await loadSitePageLive();
  return (
    <DesignedSitePage page="charity">
      <div className="flex flex-1 flex-col" data-shadcn-page="">
        <PageKindMark kind="plain" />
        <SitePageRender data={seedCharityDesign()} live={live} page="charity" />
      </div>
    </DesignedSitePage>
  );
}

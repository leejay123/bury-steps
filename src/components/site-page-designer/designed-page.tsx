import type { ReactNode } from "react";
import { PageKindMark } from "@/components/shadcnio/page-kind";
import { getPublishedSitePageDesign } from "@/lib/site-page-designs-store";
import { loadSitePageLive } from "@/lib/site-page-seeds";
import type { SitePageKey } from "@/lib/site-page-designs";
import { SitePageRender } from "./render";

/**
 * If this public page has a published design, draw that. Otherwise the
 * page's current live content (the children) stays as it is.
 */
export async function DesignedSitePage({
  children,
  page,
}: {
  children: ReactNode;
  page: SitePageKey;
}) {
  const published = await getPublishedSitePageDesign(page);
  if (!published) return children;
  const live = await loadSitePageLive();
  return (
    <div className="flex flex-1 flex-col" data-shadcn-page="">
      {page === "home" ? null : <PageKindMark kind="plain" />}
      <SitePageRender data={published} live={live} page={page} />
    </div>
  );
}

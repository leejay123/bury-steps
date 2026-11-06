"use client";

import { Render, type Data } from "@puckeditor/core";
import { isPuckData, type PuckData, type SitePageKey } from "@/lib/site-page-designs";
import { configForPage } from "./config";
import { SitePageLiveProvider, type SitePageLive } from "./live";

/** A public page drawn from a published design made in the page designer. */
export function SitePageRender({
  data,
  live,
  page,
}: {
  data: unknown;
  live: SitePageLive;
  page: SitePageKey;
}) {
  if (!isPuckData(data)) return null;
  return (
    <SitePageLiveProvider value={live}>
      <Render config={configForPage(page)} data={data as Data} />
    </SitePageLiveProvider>
  );
}

export type { PuckData };

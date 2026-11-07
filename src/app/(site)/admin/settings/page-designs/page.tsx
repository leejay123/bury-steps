import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { SitePageDesignList, SitePageDesignListSkeleton } from "@/components/site-page-designer/page-list";
import { getSitePageDesigns } from "@/lib/site-page-designs-store";
import { editorDataForPages, loadSitePageLive } from "@/lib/site-page-seeds";

export const prefetch = "partial";

export default function PageDesignsSettingsPage() {
  return (
    <SettingsPage
      description="The public pages you can design, the same way as a walk page. Publish puts the design on the live site. Close keeps a draft. Discard draft throws the draft away and leaves the live page as it is."
      title="Page designs"
    >
      <Suspense fallback={<SitePageDesignListSkeleton />}>
        <PlaceholderPreview fallback={<SitePageDesignListSkeleton />}>
          <PageDesignsSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function PageDesignsSettingsPageContent() {
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permDisplay");
  const designs = await getSitePageDesigns();
  const [drafts, live] = await Promise.all([editorDataForPages(designs), loadSitePageLive()]);
  return <SitePageDesignList designs={designs} drafts={drafts} live={live} />;
}

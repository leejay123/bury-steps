"use client";

import { useRef, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import { toast } from "sonner";
import { X } from "lucide-react";
import { publishSitePageDesign, saveSitePageDraft } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { SITE_PAGES, type PuckData, type SitePageKey } from "@/lib/site-page-designs";
import { PuckFrameStyles } from "@/components/puck-frame-styles";
import { configForPage } from "./config";
import { SitePageLiveProvider, type SitePageLive } from "./live";

/**
 * The public page designer: the same Puck editor as walk pages, over a
 * settings page. Publish makes the live page use this design; closing
 * without publishing keeps a draft and leaves the live page as it was.
 */
export function SitePageDesignEditor({
  live,
  onClose,
  page,
  data,
}: {
  live: SitePageLive;
  onClose: () => void;
  page: SitePageKey;
  data: PuckData;
}) {
  const meta = SITE_PAGES.find((item) => item.key === page);
  const current = useRef<Data>(data as Data);
  const [start] = useState(data as Data);

  async function publish(next: Data) {
    const result = await publishSitePageDesign(page, JSON.stringify(next));
    if (result && !result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result?.message ?? "Design published.");
  }

  async function close() {
    const result = await saveSitePageDraft(page, JSON.stringify(current.current));
    if (result && !result.ok) toast.error(result.error);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      role="dialog"
      aria-label={`${meta?.title ?? "Page"} designer`}
      aria-modal="true"
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <span className="font-semibold">{meta?.title ?? "Page"} designer</span>
        <p className="text-sm text-muted-foreground">
          Edit, hide or reorder the sections. Publish to put this on the live page.
        </p>
        <Button
          aria-label="Close the designer"
          className="ml-auto"
          onClick={() => void close()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <SitePageLiveProvider value={live}>
          <Puck
            config={configForPage(page)}
            data={start}
            headerTitle={meta?.title}
            height="100%"
            onChange={(next) => {
              current.current = next;
            }}
            onPublish={publish}
            overrides={{ iframe: PuckFrameStyles }}
          />
        </SitePageLiveProvider>
      </div>
    </div>
  );
}

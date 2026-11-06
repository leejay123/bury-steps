"use client";

import { useRef, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import { toast } from "sonner";
import { X } from "lucide-react";
import { discardSitePageDraft, publishSitePageDesign, saveSitePageDraft } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { SITE_PAGES, type PuckData, type SitePageKey } from "@/lib/site-page-designs";
import { PuckFrameStyles } from "@/components/puck-frame-styles";
import { configForPage } from "./config";
import { SitePageLiveProvider, type SitePageLive } from "./live";

/**
 * The public page designer: the same Puck editor as walk pages, over a
 * settings page. Publish makes the live page use this design; closing
 * without publishing keeps a draft; Discard throws the draft away.
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
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [busy, setBusy] = useState(false);

  async function publish(next: Data) {
    const result = await publishSitePageDesign(page, JSON.stringify(next));
    if (result && !result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result?.message ?? "Design published.");
  }

  async function close() {
    if (busy) return;
    setBusy(true);
    const result = await saveSitePageDraft(page, JSON.stringify(current.current));
    if (result && !result.ok) toast.error(result.error);
    onClose();
  }

  async function discard() {
    if (busy) return;
    setBusy(true);
    const result = await discardSitePageDraft(page);
    if (result && !result.ok) {
      toast.error(result.error);
      setBusy(false);
      return;
    }
    toast.success(result?.message ?? "Draft discarded. The live page is unchanged.");
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
        {confirmingDiscard ? (
          <p className="text-sm text-muted-foreground">
            Throw this draft away? The live page stays as it is.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Edit, hide or reorder the sections. Publish to put this on the live page. Close keeps a
            draft.
          </p>
        )}
        {confirmingDiscard ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              disabled={busy}
              onClick={() => setConfirmingDiscard(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Keep draft
            </Button>
            <Button
              disabled={busy}
              onClick={() => void discard()}
              size="sm"
              type="button"
              variant="destructive"
            >
              {busy ? "Discarding…" : "Discard draft"}
            </Button>
          </div>
        ) : (
          <>
            <Button
              className="ml-auto"
              disabled={busy}
              onClick={() => setConfirmingDiscard(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              Discard draft
            </Button>
            <Button
              aria-label="Close the designer"
              disabled={busy}
              onClick={() => void close()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </>
        )}
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

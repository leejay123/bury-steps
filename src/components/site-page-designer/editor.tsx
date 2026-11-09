"use client";

import { DesignerNarrowCover } from "@/components/designer-narrow-cover";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Puck, type Data } from "@puckeditor/core";
// Puck's styles up front, the copy with no outside font: otherwise Puck adds
// them itself with an @import of rsms.me/inter, which the site's security
// rules (style-src in next.config.ts) block, filling the console with errors.
import "@puckeditor/core/no-external.css";
import { toast } from "sonner";
import { discardSitePageDraft, publishSitePageDesign, saveSitePageDraft } from "@/server/actions";
import { Button } from "@/components/ui/button";
import {
  BlockSearchItem,
  BlockSearchList,
  DESIGNER_UI,
  DESIGNER_VIEWPORTS,
  DesignerTopBar,
  DesignerTopBarProvider,
  DesignerTopBarSlot,
  type DesignerStatus,
} from "@/components/designer-top-bar";
import { SITE_PAGES, type PuckData, type SitePageKey } from "@/lib/site-page-designs";
import { configForPage } from "./config";
import { SitePageLiveProvider, type SitePageLive } from "./live";
import { SitePagePreviewFrame } from "./preview-frame";

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
  status,
}: {
  live: SitePageLive;
  onClose: () => void;
  page: SitePageKey;
  data: PuckData;
  /** How the page stands now: an unpublished draft, published, or the live page. */
  status?: DesignerStatus;
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

  // The top bar, handed to Puck through DesignerTopBarSlot: a stable header, so
  // its View panel stays open while choices change things.
  const topBar = (
      <DesignerTopBar
        busy={busy}
        closeLabel="Close the designer (keeps a draft)"
        note={
          confirmingDiscard
            ? "Throw this draft away? The live page stays as it is."
            : "Close keeps a draft · the live page stays as it is until you publish."
        }
        noteAlways={confirmingDiscard}
        onClose={() => void close()}
        onPublish={publish}
        secondary={
          confirmingDiscard ? (
            <>
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
            </>
          ) : (
            <Button
              disabled={busy}
              onClick={() => setConfirmingDiscard(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              Discard draft
            </Button>
          )
        }
        status={status}
        title={`${meta?.title ?? "Page"} page`}
      />
  );
  // Each block in the Blocks panel, hidden while Find a block doesn't match it
  // (stable, so Puck doesn't rebuild the list on every change).
  const blockItem = useCallback(
    ({ children, name }: { children?: ReactNode; name: string }) => (
      <BlockSearchItem label={configForPage(page).components[name]?.label ?? name}>{children}</BlockSearchItem>
    ),
    [page],
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      data-designer=""
      role="dialog"
      aria-label={`${meta?.title ?? "Page"} designer`}
      aria-modal="true"
    >
      {/* Too narrow (a resized window): a message over it, nothing lost. */}
      <DesignerNarrowCover />
      <div className="min-h-0 flex-1">
        <SitePageLiveProvider value={live}>
          <DesignerTopBarProvider value={topBar}>
          <Puck
            config={configForPage(page)}
            data={start}
            height="100%"
            onChange={(next) => {
              current.current = next;
            }}
            overrides={{
              iframe: (props) => <SitePagePreviewFrame {...props} page={page} />,
              // Find a block, over the Blocks panel's list.
              components: BlockSearchList,
              componentItem: blockItem,
              // The one top bar (designer-top-bar.tsx) in place of Puck's own.
              header: DesignerTopBarSlot,
            }}
            ui={DESIGNER_UI}
            viewports={DESIGNER_VIEWPORTS}
          />
          </DesignerTopBarProvider>
        </SitePageLiveProvider>
      </div>
    </div>
  );
}

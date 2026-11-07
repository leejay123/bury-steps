"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paintbrush } from "lucide-react";
import { discardSitePageDraft } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import {
  pageHasPublished,
  pageHasUnpublishedDraft,
  SITE_PAGES,
  type PuckData,
  type SitePageDesigns,
  type SitePageKey,
} from "@/lib/site-page-designs";
import type { SitePageLive } from "./live";

const SitePageDesignEditor = dynamic(
  () => import("./editor").then((mod) => mod.SitePageDesignEditor),
  { ssr: false },
);

const WIDE = "(min-width: 1024px)";
function subscribeWide(change: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const isWide = () => window.matchMedia(WIDE).matches;

function status(designs: SitePageDesigns, key: SitePageKey): string {
  const slot = designs[key];
  if (pageHasUnpublishedDraft(slot)) return "Unpublished draft";
  if (pageHasPublished(slot)) return "Published";
  return "Uses the current live page";
}

const ROW = "items-start gap-3 px-4 py-3.5";

/**
 * Settings → Page designs: the public pages, each opening the same
 * Puck designer as walk pages. Computers only (1024px+); the list stays
 * visible on a phone or tablet.
 */
export function SitePageDesignList({
  designs,
  drafts,
  live,
}: {
  designs: SitePageDesigns;
  drafts: Record<SitePageKey, PuckData>;
  live: SitePageLive;
}) {
  const computer = useSyncExternalStore(subscribeWide, isWide, () => false);
  const router = useRouter();
  const [open, setOpen] = useState<SitePageKey | null>(null);
  const close = useCallback(() => {
    setOpen(null);
    router.refresh();
  }, [router]);

  return (
    <>
      {computer ? null : (
        <p className="text-sm text-muted-foreground" data-edge-note="">
          Open a page&apos;s designer on a computer (1024px or wider). The list is here so you can still see which pages have a design.
        </p>
      )}
      <DataList data-edge-top="">
        {SITE_PAGES.map((page) => (
          <DataListItem className={ROW} key={page.key}>
            <DataListBody className="flex flex-col gap-1">
              <div className="flex flex-col gap-x-3 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="font-medium leading-snug">{page.title}</p>
                <p className="text-xs text-muted-foreground sm:shrink-0 sm:text-right">{status(designs, page.key)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{page.description}</p>
              <Link className="w-fit text-sm underline-offset-4 hover:underline" href={page.path}>
                {page.path}
              </Link>
            </DataListBody>
            {computer || pageHasUnpublishedDraft(designs[page.key]) ? (
              <DataListActions className="flex-wrap gap-2">
                {computer ? (
                  <Button onClick={() => setOpen(page.key)} size="sm" type="button" variant="outline">
                    <Paintbrush data-icon="inline-start" />
                    Design this page
                  </Button>
                ) : null}
                {pageHasUnpublishedDraft(designs[page.key]) ? (
                  <DiscardDraftButton
                    onDiscarded={() => router.refresh()}
                    page={page.key}
                    title={page.title}
                  />
                ) : null}
              </DataListActions>
            ) : null}
          </DataListItem>
        ))}
      </DataList>
      {open
        ? createPortal(
            <SitePageDesignEditor data={drafts[open]} live={live} onClose={close} page={open} />,
            document.body,
          )
        : null}
    </>
  );
}

function DiscardDraftButton({
  onDiscarded,
  page,
  title,
}: {
  onDiscarded: () => void;
  page: SitePageKey;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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
    setBusy(false);
    setOpen(false);
    onDiscarded();
  }

  return (
    <AlertDialog
      closeDisabled={busy}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          Discard draft
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={busy}>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard the {title} draft?</AlertDialogTitle>
          <AlertDialogDescription>
            Unpublished work on this page will be thrown away. The live page stays as it is.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} type="button">
            Keep draft
          </AlertDialogCancel>
          <Button disabled={busy} onClick={() => void discard()} type="button" variant="destructive">
            {busy ? "Discarding…" : "Discard draft"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Grey stand-in for each row while the list loads. */
export function SitePageDesignListSkeleton() {
  return (
    <DataList data-edge-top="">
      {SITE_PAGES.map((page) => (
        <DataListItem className={ROW} key={page.key}>
          <DataListBody className="flex flex-col gap-1">
            <p className="font-medium leading-snug">{page.title}</p>
            <p className="text-sm text-muted-foreground">{page.description}</p>
          </DataListBody>
          <span className="flex h-8 items-center">
            <Skeleton className="h-8 w-36 rounded-md" />
          </span>
        </DataListItem>
      ))}
    </DataList>
  );
}

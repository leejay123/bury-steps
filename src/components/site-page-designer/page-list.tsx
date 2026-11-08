"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paintbrush, Search } from "lucide-react";
import { discardSitePageDraft } from "@/server/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClearFiltersButton, EmptyState } from "@/components/empty-state";
import { EDGE_FILTER, EdgeBar } from "@/components/edge-search";
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

type PageStatus = "published" | "draft" | "live";

function statusOf(designs: SitePageDesigns, key: SitePageKey): PageStatus {
  const slot = designs[key];
  if (pageHasUnpublishedDraft(slot)) return "draft";
  if (pageHasPublished(slot)) return "published";
  return "live";
}

const STATUS_LABEL: Record<PageStatus, string> = {
  published: "Published",
  draft: "Unpublished draft",
  live: "Uses the live page",
};

/** Colour as well as words, each differing in lightness too. */
const STATUS_PILL: Record<PageStatus, string> = {
  published: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  draft: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  live: "bg-muted text-foreground",
};
const STATUS_DOT: Record<PageStatus, string> = {
  published: "bg-emerald-600",
  draft: "bg-amber-600",
  live: "bg-muted-foreground",
};

type Filter = "all" | PageStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Drafts" },
  { id: "live", label: "Live page" },
];

const ROW = "items-center gap-x-6 gap-y-3 px-4 py-5 sm:px-6";

/** The three totals across the top, edge to edge (data-edge-stats): two
 * side by side on a phone with the last across the width, three in a row
 * from tablet up. */
function Totals({ counts }: { counts: Record<PageStatus, number> | null }) {
  const cells: { key: PageStatus; label: string }[] = [
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts waiting" },
    { key: "live", label: "Using the live page" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3" data-edge-stats="">
      {cells.map((cell, index) => (
        <div className={cn("flex flex-col gap-1", index === 2 && "col-span-2 md:col-span-1")} key={cell.key}>
          <p className="text-sm text-muted-foreground">{cell.label}</p>
          {counts ? (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{counts[cell.key]}</p>
          ) : (
            <Skeleton className="h-8 w-10" />
          )}
        </div>
      ))}
    </div>
  );
}

/** A small sketch of a page: the hero coloured once the page has a design. */
function PageSketch({ designed }: { designed: boolean }) {
  return (
    <div
      aria-hidden
      className="hidden h-20 w-32 shrink-0 flex-col gap-1.5 rounded-lg border bg-background p-2.5 sm:flex"
    >
      <div className="h-2 w-3/5 rounded-sm bg-muted" />
      <div className={cn("h-4 rounded-sm", designed ? "bg-primary/80" : "bg-muted")} />
      <div className="flex flex-1 gap-1.5">
        <div className="flex-1 rounded-sm bg-muted" />
        <div className="flex-1 rounded-sm bg-muted" />
      </div>
    </div>
  );
}

/**
 * Settings → Page designs: the public pages, each opening the same
 * Puck designer as walk pages. Edge to edge: the totals, a filter strip
 * (EdgeBar, as the Reports pages), then one full-width row per page. The
 * designer is for computers only (1024px+); the list stays visible on a
 * phone or tablet.
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
  const [filter, setFilter] = useState<Filter>("all");
  const close = useCallback(() => {
    setOpen(null);
    router.refresh();
  }, [router]);

  const statuses = Object.fromEntries(SITE_PAGES.map((page) => [page.key, statusOf(designs, page.key)])) as Record<
    SitePageKey,
    PageStatus
  >;
  const counts: Record<PageStatus, number> = { published: 0, draft: 0, live: 0 };
  for (const page of SITE_PAGES) counts[statuses[page.key]] += 1;
  const shown = SITE_PAGES.filter((page) => filter === "all" || statuses[page.key] === filter);

  return (
    <>
      <Totals counts={counts} />
      <EdgeBar>
        {/* The four filters share the strip's whole width equally. */}
        <div aria-label="Show" className="flex w-full *:flex-1" role="group">
          {FILTERS.map((option, index) => {
            const on = filter === option.id;
            const total = option.id === "all" ? SITE_PAGES.length : counts[option.id];
            return (
              <Button
                aria-pressed={on}
                className={cn(
                  EDGE_FILTER,
                  // Narrower on a phone, so all four fit across.
                  "gap-1.5 px-2 text-[0.8125rem] sm:gap-2 sm:px-4 sm:text-sm",
                  index === 0 && "border-l-0!",
                  on ? "bg-accent! text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                key={option.id}
                onClick={() => setFilter(option.id)}
                type="button"
                variant="ghost"
              >
                {option.label}
                <span className="tabular-nums text-muted-foreground">{total}</span>
              </Button>
            );
          })}
        </div>
        {computer ? null : (
          <p className="flex w-full items-center border-t px-4 py-3 text-sm text-muted-foreground">
            Open a page’s designer on a computer (1024px or wider).
          </p>
        )}
      </EdgeBar>
      {shown.length === 0 ? (
        // The site's empty box, as on every other list, with Clear filters.
        <EmptyState
          action={<ClearFiltersButton onClick={() => setFilter("all")} />}
          description="Try a different filter, or show all pages."
          icon={Search}
          title="No matching pages"
        />
      ) : (
        <DataList data-edge-top="">
          {shown.map((page) => {
            const pageStatus = statuses[page.key];
            const draft = pageStatus === "draft";
            return (
              <DataListItem className={cn(ROW, "flex-wrap", draft && "bg-muted/40")} key={page.key}>
                <PageSketch designed={pageStatus !== "live"} />
                <DataListBody className="flex min-w-48 flex-1 flex-col gap-1">
                  <h2 className="text-lg font-semibold leading-snug tracking-tight">{page.title}</h2>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                  <Link
                    className="w-fit font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    href={page.path}
                  >
                    {page.path}
                  </Link>
                </DataListBody>
                {/* A fixed-width slot, so the badges line up down the list. */}
                <div className="shrink-0 sm:w-44">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                      STATUS_PILL[pageStatus],
                    )}
                  >
                    <span aria-hidden className={cn("size-2 rounded-full", STATUS_DOT[pageStatus])} />
                    {STATUS_LABEL[pageStatus]}
                  </span>
                </div>
                {computer || draft ? (
                  <DataListActions className="ms-auto flex-wrap gap-2">
                    {draft ? (
                      <DiscardDraftButton onDiscarded={() => router.refresh()} page={page.key} title={page.title} />
                    ) : null}
                    {computer ? (
                      <Button onClick={() => setOpen(page.key)} size="sm" type="button">
                        <Paintbrush data-icon="inline-start" />
                        {draft ? "Carry on designing" : "Design this page"}
                      </Button>
                    ) : null}
                  </DataListActions>
                ) : null}
              </DataListItem>
            );
          })}
        </DataList>
      )}
      {open
        ? createPortal(
            <SitePageDesignEditor
              data={drafts[open]}
              live={live}
              onClose={close}
              page={open}
              status={{
                draft: { label: "Draft", tone: "draft" as const },
                published: { label: "Published", tone: "published" as const },
                live: { label: "Live page", tone: "live" as const },
              }[statuses[open]]}
            />,
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

/** While the list loads: the same totals, strip, rows and band, with grey
 * shapes for the counts, statuses and buttons. */
export function SitePageDesignListSkeleton() {
  return (
    <>
      <Totals counts={null} />
      <EdgeBar>
        <div className="flex w-full *:flex-1">
          {FILTERS.map((option, index) => (
            <span
              className={cn(
                EDGE_FILTER,
                "flex items-center justify-center gap-1.5 px-2 text-[0.8125rem] text-muted-foreground sm:gap-2 sm:px-4 sm:text-sm",
                index === 0 && "border-l-0!",
              )}
              key={option.id}
            >
              {option.label}
              <Skeleton className="h-4 w-3" />
            </span>
          ))}
        </div>
      </EdgeBar>
      <DataList data-edge-top="">
        {SITE_PAGES.map((page) => (
          <DataListItem className={cn(ROW, "flex-wrap")} key={page.key}>
            <Skeleton className="hidden h-20 w-32 shrink-0 rounded-lg sm:block" />
            <DataListBody className="flex min-w-48 flex-1 flex-col gap-1">
              <h2 className="text-lg font-semibold leading-snug tracking-tight">{page.title}</h2>
              <p className="text-sm text-muted-foreground">{page.description}</p>
              <p className="w-fit font-mono text-xs text-muted-foreground">{page.path}</p>
            </DataListBody>
            <div className="shrink-0 sm:w-44">
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <span className="ms-auto flex h-8 items-center">
              <Skeleton className="h-8 w-36 rounded-md" />
            </span>
          </DataListItem>
        ))}
      </DataList>
    </>
  );
}

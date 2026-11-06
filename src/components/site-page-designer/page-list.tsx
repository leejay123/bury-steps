"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  pageHasDraft,
  pageHasPublished,
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
  if (pageHasPublished(slot)) return "Published";
  if (pageHasDraft(slot)) return "Draft";
  return "Uses the current live page";
}

/**
 * Settings → Page designs: the six public pages, each opening the same
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
  const [open, setOpen] = useState<SitePageKey | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      {computer ? null : (
        <p className="text-sm text-muted-foreground">
          Open a page's designer on a computer (1024px or wider). The list is here so you can still see which pages have a design.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Design</TableHead>
            <TableHead className="text-end"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SITE_PAGES.map((page) => (
            <TableRow key={page.key}>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{page.title}</div>
                <div className="text-muted-foreground text-xs">{page.description}</div>
              </TableCell>
              <TableCell>
                <Link className="underline-offset-4 hover:underline" href={page.path}>
                  {page.path}
                </Link>
              </TableCell>
              <TableCell>{status(designs, page.key)}</TableCell>
              <TableCell className="text-end">
                {computer ? (
                  <Button onClick={() => setOpen(page.key)} size="sm" type="button" variant="outline">
                    <Paintbrush data-icon="inline-start" />
                    Design this page
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {open
        ? createPortal(
            <SitePageDesignEditor data={drafts[open]} live={live} onClose={close} page={open} />,
            document.body,
          )
        : null}
    </>
  );
}

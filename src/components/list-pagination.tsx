"use client";

import type { RefObject } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function ListPagination({
  noun,
  onPageChange,
  page,
  pageCount,
  pageSize,
  scrollToRef,
  total,
}: {
  noun: string;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  scrollToRef?: RefObject<HTMLElement | null>;
  total: number;
}) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function go(next: number) {
    onPageChange(next);
    // Wait a frame for the new page to be drawn: scrolling straight away
    // started a smooth scroll that the browser then cancelled when the list
    // changed height, leaving you mid-list or at the footer.
    requestAnimationFrame(() => scrollListTop(scrollToRef?.current));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {start}–{end} of {total} {noun}
      </p>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled={page <= 1} onClick={() => go(page - 1)} />
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-sm tabular-nums text-muted-foreground">
              {page} / {pageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext disabled={page >= pageCount} onClick={() => go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

/** Bring the top of the list just under the sticky header, if it's above the screen. */
function scrollListTop(list: HTMLElement | null | undefined) {
  if (!list) return;
  const header = document.querySelector("header[data-site-header]");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const top = list.getBoundingClientRect().top - headerHeight - 16;
  if (top >= 0) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: window.scrollY + top, behavior: reduce ? "auto" : "smooth" });
}

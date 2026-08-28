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
    scrollToRef?.current?.scrollIntoView({ block: "start", behavior: "smooth" });
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

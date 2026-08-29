"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import type { WalkGamePerson } from "@/lib/walk-game";

export function ProgressBoard({ board }: { board: WalkGamePerson[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(board);

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <DataList>
        {paging.paged.map((row) => (
          <DataListItem className="cursor-default hover:bg-transparent" key={row.userId}>
            <DataListBody>
              <p className="font-medium">
                {row.name}
                {row.isViewer ? (
                  <Badge className="ml-2 align-middle" variant="outline">
                    You
                  </Badge>
                ) : null}
              </p>
            </DataListBody>
            <p className="text-sm text-muted-foreground">
              {row.monthCount === 1 ? "1 walk" : `${row.monthCount} walks`}
            </p>
          </DataListItem>
        ))}
      </DataList>
      <ListPagination
        noun="people"
        onPageChange={paging.setPage}
        page={paging.page}
        pageCount={paging.pageCount}
        pageSize={paging.pageSize}
        scrollToRef={listRef}
        total={paging.total}
      />
    </div>
  );
}

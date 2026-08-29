"use client";

import { useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import {
  competitionPlaces,
  formatPlaceOrdinal,
  type WalkGamePerson,
} from "@/lib/walk-game";

export function ProgressBoard({ board }: { board: WalkGamePerson[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const ranked = useMemo(() => {
    const places = competitionPlaces(board.map((row) => row.monthCount));
    return board.map((row, index) => ({ ...row, place: places[index] }));
  }, [board]);
  const paging = usePagedList(ranked);

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <DataList>
        {paging.paged.map((row) => {
          const placeLabel = formatPlaceOrdinal(row.place);
          return (
            <DataListItem className="cursor-default hover:bg-transparent" key={row.userId}>
              <span
                aria-label={placeLabel}
                className="w-10 shrink-0 text-sm font-medium tabular-nums text-muted-foreground"
              >
                {placeLabel}
              </span>
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
          );
        })}
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

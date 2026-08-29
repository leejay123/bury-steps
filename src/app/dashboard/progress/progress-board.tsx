"use client";

import { useMemo, useRef } from "react";
import { Award, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import {
  competitionPlaces,
  formatPlaceOrdinal,
  type WalkGamePerson,
} from "@/lib/walk-game";
import { cn } from "@/lib/utils";

function PlaceMark({ place }: { place: number }) {
  const label = formatPlaceOrdinal(place);
  const Icon = place === 1 ? Trophy : place === 2 ? Medal : place === 3 ? Award : null;

  return (
    <div
      aria-label={label}
      className={cn(
        "flex w-12 shrink-0 flex-col items-center justify-center gap-0.5",
        place <= 3 ? "text-foreground" : "text-muted-foreground",
      )}
      title={label}
    >
      {Icon ? <Icon aria-hidden className="size-4" strokeWidth={1.75} /> : null}
      <span className={cn("text-xs font-medium tabular-nums", place > 3 && "text-sm")}>
        {label}
      </span>
    </div>
  );
}

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
        {paging.paged.map((row) => (
          <DataListItem className="cursor-default hover:bg-transparent" key={row.userId}>
            <PlaceMark place={row.place} />
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

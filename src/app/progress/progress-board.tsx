"use client";

import { useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import type { WalkGamePerson } from "@/lib/walk-game";

type BoardGroup = {
  monthCount: number;
  label: string;
  people: WalkGamePerson[];
};

function groupBoard(board: WalkGamePerson[]): BoardGroup[] {
  const groups: BoardGroup[] = [];
  for (const row of board) {
    const last = groups[groups.length - 1];
    if (last && last.monthCount === row.monthCount) {
      last.people.push(row);
      continue;
    }
    groups.push({
      monthCount: row.monthCount,
      label: row.monthCount === 1 ? "1 walk" : `${row.monthCount} walks`,
      people: [row],
    });
  }
  return groups;
}

export function ProgressBoard({ board }: { board: WalkGamePerson[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(board);
  const pageGroups = useMemo(() => groupBoard(paging.paged), [paging.paged]);

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-6">
        {pageGroups.map((group) => (
          <div className="flex flex-col gap-2" key={group.monthCount}>
            <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
            <DataList>
              {group.people.map((row) => (
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
                </DataListItem>
              ))}
            </DataList>
          </div>
        ))}
      </div>
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

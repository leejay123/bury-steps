"use client";

import { useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataList, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WalkMembers({
  completed = false,
  names,
}: {
  /** Pass true once the walk's clock-in window has fully closed. */
  completed?: boolean;
  names: string[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(names);
  const countLabel = completed
    ? names.length === 1
      ? "1 person stayed for the whole walk."
      : `${names.length} people stayed for the whole walk.`
    : names.length === 1
      ? "1 person has clocked in."
      : `${names.length} people have clocked in.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{completed ? "Who attended" : "Who’s coming"}</p>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      <div className="flex flex-col gap-4" ref={listRef}>
        <DataList>
          {paging.paged.map((name, index) => (
            <DataListItem className="cursor-default hover:bg-transparent" key={`${name}-${index}`}>
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{name}</span>
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
    </div>
  );
}

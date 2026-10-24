"use client";

import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataList, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { initials } from "@/lib/names";
import type { WalkMemberName } from "@/lib/walk-members";

export function WalkMembers({
  completed = false,
  names,
}: {
  /** Pass true once the walk's clock-in window has fully closed. */
  completed?: boolean;
  names: WalkMemberName[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(names);
  const leftEarly = names.filter((member) => member.leftEarly).length;
  const attended = `${names.length === 1 ? "1 person" : `${names.length} people`} attended`;
  const countLabel = completed
    ? leftEarly > 0
      ? `${attended} — ${leftEarly} left early.`
      : `${attended}.`
    : names.length === 1
      ? "1 person has clocked in."
      : `${names.length} people have clocked in.`;

  return (
    <div className="flex flex-col gap-3">
      {/* data-edge-pad: keeps side space when the list runs edge to edge (walk designer sections). */}
      <div className="flex flex-col gap-1" data-edge-pad="">
        <p className="text-sm font-medium">{completed ? "Who attended" : "Who’s coming"}</p>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      {/* Nobody yet (an organiser looking before anyone has clocked in): just the line above. */}
      {names.length === 0 ? null : (
        <div className="flex flex-col gap-4" ref={listRef}>
          <DataList>
            {paging.paged.map((member, index) => (
              <DataListItem className="cursor-default hover:bg-transparent" key={`${member.name}-${index}`}>
                <Avatar className="size-8 shrink-0">
                  {/* Their profile photo if they have one; initials otherwise. */}
                  {member.imageUrl ? <AvatarImage alt="" src={member.imageUrl} /> : null}
                  <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
                {completed && member.leftEarly ? (
                  <span className="ml-auto text-xs text-muted-foreground">Left early</span>
                ) : null}
              </DataListItem>
            ))}
          </DataList>
          <div data-edge-pad="">
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
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatWalkDay, formatTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export type AdminWalkRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  cancelledAt: string | null;
  attendanceCount: number;
};

export function AdminWalkTable({
  attendanceLabel = "Clock-ins",
  emptyDescription,
  emptyTitle,
  searchable = false,
  walks,
}: {
  attendanceLabel?: string;
  emptyDescription: string;
  emptyTitle: string;
  searchable?: boolean;
  walks: AdminWalkRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return walks;
    return walks.filter((walk) => {
      const hay = `${walk.title} ${walk.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, walks]);

  if (walks.length === 0) {
    return <EmptyState description={emptyDescription} icon={Footprints} title={emptyTitle} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {searchable ? (
        <InputGroup className="max-w-md">
          <InputGroupInput
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          description="Try a different name or meeting point."
          icon={Search}
          title="No matching walks"
        />
      ) : (
        <DataList>
          {filtered.map((walk) => (
            <DataListItem className="relative" key={walk.id}>
              <DataListBody>
                <p className="font-medium">
                  <Link className="after:absolute after:inset-0" href={`/admin/walks/${walk.id}`}>
                    {walk.title}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatWalkDay(new Date(walk.startsAt))} · {formatTime(new Date(walk.startsAt))}
                  {walk.location ? ` · ${walk.location}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {walk.attendanceCount} {attendanceLabel.toLowerCase()}
                </p>
              </DataListBody>
              {walk.cancelledAt ? <Badge variant="destructive">Cancelled</Badge> : null}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItem>
          ))}
        </DataList>
      )}
    </div>
  );
}

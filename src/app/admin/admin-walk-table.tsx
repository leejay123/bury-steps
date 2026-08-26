"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatWalkDate } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Walk</TableHead>
              <TableHead>When</TableHead>
              <TableHead className="hidden sm:table-cell">Meeting point</TableHead>
              <TableHead className="text-right">{attendanceLabel}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((walk) => (
              <TableRow className="relative" key={walk.id}>
                <TableCell className="font-medium">
                  <Link className="after:absolute after:inset-0" href={`/admin/walks/${walk.id}`}>
                    {walk.title}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatWalkDate(new Date(walk.startsAt))}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {walk.location || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{walk.attendanceCount}</TableCell>
                <TableCell>
                  {walk.cancelledAt ? <Badge variant="destructive">Cancelled</Badge> : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <ChevronRight className="size-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

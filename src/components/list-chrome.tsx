"use client";

import { AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FIRST_VISIT_ROWS, SkChevron, SkLine, WalkRowsSkeleton } from "@/components/list-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Search box matching the real lists — shown while the rows load, not a grey bar. */
export function ListSearch({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <InputGroup className="w-full min-w-0 sm:flex-1">
      <InputGroupInput aria-label={label} defaultValue="" placeholder={placeholder} readOnly />
      <InputGroupAddon>
        <Search data-icon="inline-start" />
      </InputGroupAddon>
    </InputGroup>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  width = "sm:w-[11rem]",
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  width?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select onValueChange={() => {}} value={value}>
        <SelectTrigger className={`w-full ${width}`} id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function tabLabel(name: string, count: number | null) {
  return count == null ? name : `${name} (${count})`;
}

/** Upcoming / History, search, status and sort — the same controls the loaded list uses. */
export function WalkListChrome({
  pastCount = null,
  rows,
  upcomingCount = null,
}: {
  pastCount?: number | null;
  rows: number;
  upcomingCount?: number | null;
}) {
  const knownEmpty = upcomingCount === 0;
  return (
    <Tabs className="w-full" defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">{tabLabel("Upcoming", upcomingCount)}</TabsTrigger>
        <TabsTrigger value="past">{tabLabel("History", pastCount)}</TabsTrigger>
      </TabsList>
      {knownEmpty ? null : (
        <TabsContent className="mt-4" value="upcoming">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <ListSearch label="Search upcoming walks" placeholder="Search by walk or meeting point…" />
              <FilterSelect
                id="walk-status-upcoming-hold"
                label="Status"
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "starting-soon", label: "Starting soon" },
                  { value: "in-progress", label: "In progress" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                value="all"
              />
              <FilterSelect
                id="walk-sort-upcoming-hold"
                label="Sort"
                options={[
                  { value: "asc", label: "Soonest first" },
                  { value: "desc", label: "Latest first" },
                ]}
                value="asc"
              />
            </div>
            <WalkRowsSkeleton rows={rows} />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

/** Role, sort and Needs attention — the same bar the members list uses. */
export function MembersFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <InputGroup className="w-full min-w-0 sm:min-w-56 sm:flex-1">
        <InputGroupInput
          aria-label="Search members"
          defaultValue=""
          placeholder="Search by name, email, or role…"
          readOnly
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>
      <FilterSelect
        id="member-role-filter-hold"
        label="Role"
        options={[
          { value: "all", label: "All roles" },
          { value: "ADMIN", label: "Organisers" },
          { value: "MEMBER", label: "Members" },
        ]}
        value="all"
        width="sm:w-44"
      />
      <FilterSelect
        id="member-sort-hold"
        label="Sort by"
        options={[
          { value: "oldest", label: "Oldest first" },
          { value: "newest", label: "Newest first" },
          { value: "name", label: "Name A–Z" },
          { value: "clockins", label: "Most clock-ins" },
        ]}
        value="oldest"
        width="sm:w-44"
      />
      <Button className="shrink-0 gap-1.5" type="button" variant="outline">
        <AlertCircle />
        Needs attention
      </Button>
    </div>
  );
}

export function ReportsFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <ListSearch label="Search accident reports" placeholder="Search by walk, people involved, or what happened…" />
      <FilterSelect
        id="report-link-filter-hold"
        label="Walk link"
        options={[
          { value: "all", label: "All reports" },
          { value: "linked", label: "Linked to a walk" },
          { value: "unlinked", label: "No linked walk" },
        ]}
        value="all"
      />
      <FilterSelect
        id="report-sort-hold"
        label="Sort"
        options={[
          { value: "desc", label: "Newest first" },
          { value: "asc", label: "Oldest first" },
        ]}
        value="desc"
      />
    </div>
  );
}

export function MessagesFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <InputGroup className="w-full min-w-0 sm:min-w-56 sm:flex-1">
        <InputGroupInput
          aria-label="Search messages"
          defaultValue=""
          placeholder="Search by name, email, or message…"
          readOnly
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>
      <FilterSelect
        id="message-date-range-hold"
        label="Date"
        options={[
          { value: "all", label: "All time" },
          { value: "today", label: "Today" },
          { value: "7", label: "Last 7 days" },
          { value: "30", label: "Last 30 days" },
        ]}
        value="all"
        width="sm:w-40"
      />
    </div>
  );
}

export function HistoryFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <InputGroup className="w-full min-w-0 sm:min-w-[16rem] sm:flex-1">
        <InputGroupInput
          aria-label="Search your walk history"
          defaultValue=""
          placeholder="Search by walk or meeting point…"
          readOnly
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>
      <FilterSelect
        id="history-status-filter-hold"
        label="Status"
        options={[
          { value: "all", label: "All" },
          { value: "full", label: "Stayed for walk" },
          { value: "left-early", label: "Left early" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        value="all"
      />
    </div>
  );
}

/**
 * One upcoming walk card, shaped like the real one (walks/upcoming-walk-cards.tsx):
 * status / day strip, title, time and place lines, arrow, two lines of the
 * description and the "Clock-in opens…" line. Grey only where the walk's own
 * details go.
 */
function MemberWalkCardSkeleton({ index }: { index: number }) {
  return (
    <Card aria-hidden className="relative gap-3 overflow-hidden pt-0" data-reveal-card="">
      <div className="mb-1 flex items-center justify-between gap-3 border-b bg-muted/50 px-6 py-1.5">
        <SkLine className="w-28" size="xs" />
        <SkLine className="w-16" size="xs" />
      </div>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <SkLine className={index % 2 ? "w-40" : "w-52"} />
          <div className="flex flex-col gap-1">
            <SkLine className="w-28" size="sm" />
            <SkLine className={index % 2 ? "w-44" : "w-36"} size="sm" />
          </div>
        </div>
        <SkChevron />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <SkLine className="w-full" size="sm" />
          <SkLine className="w-4/5" size="sm" />
        </div>
        <SkLine className="w-56" size="sm" />
      </CardContent>
    </Card>
  );
}

/** Member Walks: the real Upcoming / All walks tabs, search and filters, then a card-shaped placeholder per walk. */
export function MemberWalksHold({
  allCount = null,
  recent = 0,
  upcomingCount = null,
}: {
  allCount?: number | null;
  recent?: number;
  upcomingCount?: number | null;
}) {
  const rows = upcomingCount ?? FIRST_VISIT_ROWS;
  return (
    <div className="contents" data-page-loading="">
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">{tabLabel("Upcoming", upcomingCount)}</TabsTrigger>
          <TabsTrigger value="all-walks">{tabLabel("All walks", allCount)}</TabsTrigger>
        </TabsList>
        {rows < 1 ? null : (
          <TabsContent className="mt-4" value="upcoming">
            <div aria-busy="true" className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <ListSearch label="Search walks" placeholder="Search by walk or meeting point…" />
                <FilterSelect
                  id="walk-status-hold"
                  label="Status"
                  options={[{ value: "all", label: "All statuses" }]}
                  value="all"
                />
                <FilterSelect
                  id="walk-sort-hold"
                  label="Sort"
                  options={[{ value: "asc", label: "Soonest first" }]}
                  value="asc"
                />
              </div>
              {Array.from({ length: rows }, (_, i) => (
                <MemberWalkCardSkeleton index={i} key={i} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
      {recent > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: recent }, (_, i) => (
              <div aria-hidden className="rounded-xl border p-4" data-reveal-card="" key={i}>
                <SkLine className="w-40" />
                <SkLine className="w-56" size="sm" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function NoticesSearchChrome() {
  return (
    <InputGroup className="w-full max-w-md">
      <InputGroupInput aria-label="Search notices" defaultValue="" placeholder="Search notices…" readOnly />
      <InputGroupAddon>
        <Search data-icon="inline-start" />
      </InputGroupAddon>
    </InputGroup>
  );
}

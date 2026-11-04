"use client";

import { AlertCircle, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryTabs } from "@/components/query-tabs";
import { SkLine, WalkRowsSkeleton } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { RememberedRows } from "@/components/remembered-rows";
import { WalkTableCardSkeleton } from "@/components/walk-table-card";
import { RememberedCount } from "@/components/remembered-text";

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

/** Upcoming / History, search, status and sort — the same controls the loaded list uses. */
export function WalkListChrome({ lines }: { lines?: { title: string; detail: string }[] } = {}) {
  // Tab counts and rows as last time, from the first paint (RememberedCount /
  // RememberedRows); with no rows last time the list hides itself, and the
  // search and filters with it, as on the real page.
  return (
    <QueryTabs className="w-full" defaultValue="upcoming">
      <div data-edge-bar="" data-edge-top="">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            <RememberedCount remember="admin-walks-upcoming" />
          </TabsTrigger>
          <TabsTrigger value="past">
            History
            <RememberedCount remember="admin-walks-past" />
          </TabsTrigger>
        </TabsList>
      </div>
      {
        <TabsContent className="mt-4" value="upcoming">
          {/* The shadcn.io design's table (walk-table-card.tsx), as its placeholder. */}
          <div className="hidden [html[data-design=shadcnio]_&]:contents">
            <WalkTableCardSkeleton lines={lines} remember="admin-walks" />
          </div>
          <div className="flex flex-col gap-4 has-[>[data-reveal-list][hidden]]:hidden [html[data-design=shadcnio]_&]:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-edge-bar="">
              <ListSearch label="Search upcoming walks" placeholder="Search by walk or meeting point…" />
              <FilterSelect
                id="walk-status-upcoming-hold"
                label="Status"
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "starting-soon", label: "Starting soon" },
                  { value: "in-progress", label: "In progress" },
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
            <WalkRowsSkeleton remember="admin-walks" />
          </div>
        </TabsContent>
      }
      <TabsContent className="mt-4" value="past">
        <div className="hidden [html[data-design=shadcnio]_&]:contents">
          <WalkTableCardSkeleton remember="admin-walks-past" />
        </div>
        <div className="flex flex-col gap-4 has-[>[data-reveal-list][hidden]]:hidden [html[data-design=shadcnio]_&]:hidden">
          <WalkRowsSkeleton remember="admin-walks-past" />
        </div>
      </TabsContent>
      </QueryTabs>
  );
}

/** Role, sort and Needs attention — the same bar the members list uses. */
export function MembersFilterChrome() {
  return (
    <div className="flex flex-wrap items-center gap-2" data-edge-bar="" data-edge-top="">
      <InputGroup className="min-w-0 flex-1 basis-full sm:basis-56">
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
      <ButtonGroup aria-label="Filter members" className="max-sm:w-full">
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Role" className="max-sm:flex-1 sm:w-40" id="member-role-filter-hold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="ADMIN">Organisers</SelectItem>
            <SelectItem value="MEMBER">Members</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={() => {}} value="oldest">
          <SelectTrigger aria-label="Sort by" className="max-sm:flex-1 sm:w-40" id="member-sort-hold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="clockins">Most clock-ins</SelectItem>
          </SelectContent>
        </Select>
      </ButtonGroup>
      <Button className="shrink-0 gap-1.5 max-sm:w-full" type="button" variant="outline">
        <AlertCircle />
        Needs attention
      </Button>
    </div>
  );
}

export function ReportsFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-edge-bar="" data-edge-top="">
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" data-edge-bar="" data-edge-top="">
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
      {/* As the real bar (contact-messages-list.tsx): Unread only, off. */}
      <Button className="shrink-0 gap-1.5" tabIndex={-1} type="button" variant="outline">
        <Mail />
        Unread only
      </Button>
    </div>
  );
}

export function HistoryFilterChrome() {
  return (
    <div className="flex" data-edge-bar="" data-edge-top="">
      <ButtonGroup aria-label="Search and filter your walks" className="w-full">
        <InputGroup className="min-w-0 flex-1">
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
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Status" className="w-28 sm:w-[11rem]" id="history-status-filter-hold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="full">Stayed for walk</SelectItem>
            <SelectItem value="left-early">Left early</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </ButtonGroup>
    </div>
  );
}

/** Member Walks: the real Upcoming / All walks tabs, search and filters, then
 * card-shaped placeholders — counts, cards and recent walks as last time,
 * from the first paint (RememberedCount / RememberedRows). */
export function MemberWalksHold({ lines }: { lines?: { title: string; detail: string }[] } = {}) {
  return (
    <div className="contents" data-page-loading="">
      <QueryTabs defaultValue="upcoming">
        <div data-edge-bar="" data-edge-top="">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
              <RememberedCount remember="member-walks" />
            </TabsTrigger>
            <TabsTrigger value="all-walks">
              All walks
              <RememberedCount remember="member-walks-all" />
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="mt-4" value="upcoming">
          {/* The shadcn.io design's table (walk-table-card.tsx), which members use too, as its placeholder. */}
          <div className="hidden [html[data-design=shadcnio]_&]:contents">
            <WalkTableCardSkeleton lines={lines} remember="member-walks-rows" />
          </div>
          <div aria-busy="true" className="flex flex-col gap-4 has-[>[data-reveal-list][hidden]]:hidden [html[data-design=shadcnio]_&]:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-edge-bar="">
              <ListSearch label="Search walks" placeholder="Search by walk or meeting point…" />
              <FilterSelect
                id="walk-status-hold"
                label="Status"
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "starting-soon", label: "Starting soon" },
                  { value: "in-progress", label: "In progress" },
                ]}
                value="all"
              />
              <FilterSelect
                id="walk-sort-hold"
                label="Sort"
                options={[
                  { value: "asc", label: "Soonest first" },
                  { value: "desc", label: "Latest first" },
                ]}
                value="asc"
              />
            </div>
            {/* The same rows as the organisers' list, which members now use too. */}
            <WalkRowsSkeleton remember="member-walks-rows" />
          </div>
      </TabsContent>
    </QueryTabs>
      {/* Your recent walks, as the page draws them (walks/page.tsx and recent-walks-carousel.tsx):
          the heading with its View all button, then the carousel's cards (two across from
          tablets), and its ‹ › buttons when there's more than one. Hidden with no recent walks. */}
      <section className="flex flex-col gap-3 has-[[data-reveal-list][hidden]]:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="w-full">
          <div className="overflow-hidden">
            <RememberedRows
              className="-ml-4 flex"
              inline
              max={3}
              remember="member-recent"
              rowClassName="min-w-0 shrink-0 grow-0 basis-full pl-4 md:basis-1/2"
              rows={Array.from({ length: 3 }, (_, i) => (
                <div aria-hidden className="h-full rounded-xl border p-4" data-reveal-card="" key={i}>
                  <SkLine className="w-40" />
                  <SkLine className="w-56" size="sm" />
                </div>
              ))}
            />
          </div>
          <div className="mt-3 hidden justify-end gap-2 [section:has([data-sk-row]:nth-child(2):not([hidden]))_&]:flex">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function NoticesSearchChrome() {
  return (
    <div data-edge-bar="" data-edge-top="">
      <InputGroup className="w-full">
        <InputGroupInput aria-label="Search notices" defaultValue="" placeholder="Search notices…" readOnly />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

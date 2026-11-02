"use client";

import { AlertCircle, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
export function WalkListChrome() {
  // Tab counts and rows as last time, from the first paint (RememberedCount /
  // RememberedRows); with no rows last time the list hides itself, and the
  // search and filters with it, as on the real page.
  return (
    <Tabs className="w-full" defaultValue="upcoming">
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
            <WalkTableCardSkeleton remember="admin-walks" />
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
    </Tabs>
  );
}

/** Role, sort and Needs attention — the same bar the members list uses. */
export function MembersFilterChrome() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" data-edge-bar="" data-edge-top="">
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" data-edge-bar="" data-edge-top="">
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

/** Member Walks: the real Upcoming / All walks tabs, search and filters, then
 * card-shaped placeholders — counts, cards and recent walks as last time,
 * from the first paint (RememberedCount / RememberedRows). */
export function MemberWalksHold() {
  return (
    <div className="contents" data-page-loading="">
      <Tabs defaultValue="upcoming">
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
            <WalkTableCardSkeleton remember="member-walks-rows" />
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
      </Tabs>
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

"use client";

import { AlertCircle, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EDGE_FILTER, EdgeBar, EdgeFilters, EdgeSearch } from "@/components/edge-search";
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

/** The organisers' Walks list as it loads: the one table (no tabs), its search and Filter, and
 * the rows as many as last time — the same controls the loaded list uses. */
export function WalkListChrome({ lines }: { lines?: { title: string; detail: string }[] } = {}) {
  return (
    <>
      {/* The shadcn.io design's table (walk-table-card.tsx), as its placeholder. */}
      <div className="hidden [html[data-design=shadcnio]_&]:contents">
        <WalkTableCardSkeleton lines={lines} remember="admin-walks" />
      </div>
      <div className="flex flex-col gap-4 has-[>[data-reveal-list][hidden]]:hidden [html[data-design=shadcnio]_&]:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-edge-bar="">
          <ListSearch label="Search walks" placeholder="Search by walk or meeting point…" />
          <FilterSelect
            id="walk-status-all-hold"
            label="Status"
            options={[
              { value: "all", label: "All walks" },
              { value: "upcoming", label: "Upcoming" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value="all"
          />
          <FilterSelect
            id="walk-sort-all-hold"
            label="Sort"
            options={[
              { value: "first", label: "Upcoming first" },
              { value: "desc", label: "Latest first" },
              { value: "asc", label: "Oldest first" },
            ]}
            value="first"
          />
        </div>
        <WalkRowsSkeleton remember="admin-walks" />
      </div>
    </>
  );
}

/** Role, sort and Needs attention — the same bar the members list uses. */
export function MembersFilterChrome() {
  return (
    <EdgeBar edgeTop>
      <EdgeSearch label="Search members" placeholder="Search by name, email, or role…" readOnly stack />
      <EdgeFilters stack>
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Role" className={`${EDGE_FILTER} sm:w-40`} id="member-role-filter-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="ADMIN">Organisers</SelectItem>
          <SelectItem value="MEMBER">Members</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={() => {}} value="oldest">
          <SelectTrigger aria-label="Sort by" className={`${EDGE_FILTER} sm:w-40`} id="member-sort-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="name">Name A–Z</SelectItem>
          <SelectItem value="clockins">Most clock-ins</SelectItem>
          </SelectContent>
        </Select>
      </EdgeFilters>
      <EdgeFilters stack>
        <Button className={cn(EDGE_FILTER, "gap-1.5")} tabIndex={-1} type="button" variant="outline">
          <AlertCircle />
          Needs attention
        </Button>
      </EdgeFilters>
    </EdgeBar>
  );
}

export function ReportsFilterChrome() {
  return (
    <EdgeBar edgeTop>
      <EdgeSearch label="Search accident reports" placeholder="Search by walk, people involved, or what happened…" readOnly stack />
      <EdgeFilters stack>
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Walk link" className={`${EDGE_FILTER} sm:w-[11rem]`} id="report-link-filter-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">All reports</SelectItem>
          <SelectItem value="linked">Linked to a walk</SelectItem>
          <SelectItem value="unlinked">No linked walk</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={() => {}} value="desc">
          <SelectTrigger aria-label="Sort" className={`${EDGE_FILTER} sm:w-[11rem]`} id="report-sort-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="desc">Newest first</SelectItem>
          <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </EdgeFilters>
    </EdgeBar>
  );
}

export function MessagesFilterChrome() {
  return (
    <EdgeBar edgeTop>
      <EdgeSearch label="Search messages" placeholder="Search by name, email, or message…" readOnly stack />
      <EdgeFilters stack>
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Date" className={`${EDGE_FILTER} sm:w-40`} id="message-date-range-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        {/* As the real bar (contact-messages-list.tsx): Unread only, off. */}
        <Button className={cn(EDGE_FILTER, "gap-1.5")} tabIndex={-1} type="button" variant="outline">
          <Mail />
          Unread only
        </Button>
      </EdgeFilters>
    </EdgeBar>
  );
}

export function HistoryFilterChrome() {
  return (
    <EdgeBar edgeTop>
      <EdgeSearch label="Search your walk history" placeholder="Search by walk or meeting point…" readOnly />
      <EdgeFilters>
        <Select onValueChange={() => {}} value="all">
          <SelectTrigger aria-label="Status" className={`${EDGE_FILTER} w-24 sm:w-[12.5rem]`} id="history-status-filter-hold" tabIndex={-1}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="full">Stayed for walk</SelectItem>
          <SelectItem value="left-early">Left early</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </EdgeFilters>
    </EdgeBar>
  );
}

/** Member Walks: the real Upcoming / All walks tabs, search and filters, then
 * card-shaped placeholders — counts, cards and recent walks as last time,
 * from the first paint (RememberedCount / RememberedRows). */
export function MemberWalksHold({ lines }: { lines?: { title: string; detail: string }[] } = {}) {
  return (
    <div className="contents" data-page-loading="">
      <QueryTabs defaultValue="upcoming">
        <div data-edge-bar="" data-edge-flush="" data-edge-top="">
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
    <EdgeBar edgeTop>
      <EdgeSearch label="Search notices" placeholder="Search notices…" readOnly />
    </EdgeBar>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, ClipboardList, Printer, Search } from "lucide-react";
import { formatWalkDay, formatTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IntentLink } from "@/components/intent-link";
import { AdminPageIntro } from "../../admin-page-intro";
import { EDGE_FILTER, EdgeBar, EdgeFilters, EdgeSearch } from "@/components/edge-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ReportReadView } from "./report-read-view";
import { AddForm, EditForm } from "./report-form";
import { RemoveButton } from "./remove-report-button";
import { matchesReportQuery, type ReportView, type WalkOption } from "./types";
import { ClearFiltersButton } from "@/components/empty-state";

export type { ReportView, WalkOption };

type DrawerMode =
  | { type: "add" }
  | { type: "view"; report: ReportView }
  | { type: "edit"; report: ReportView };

export function AccidentReportManager({
  reports,
  walks,
  createWalks,
  hasAnyReports,
  linkFilter,
  sortOrder,
  canCreate,
  canEdit,
  canDelete,
  canViewMembers = false,
  intro,
}: {
  /** The page heading — drawn here so "Add report" can sit beside it, in the
   * same spot as "Create a walk" on the Walks page. */
  intro: { title: string; description: string };
  /** Rows for the current link/sort filters — search is client-only (no PII in the URL). */
  reports: ReportView[];
  walks: WalkOption[];
  /** The walks a new report can be about (Edit keeps `walks`). */
  createWalks: WalkOption[];
  hasAnyReports: boolean;
  linkFilter: "all" | "linked" | "unlinked";
  sortOrder: "desc" | "asc";
  /** permReportsCreate — gates the "Add report" button. */
  canCreate: boolean;
  /** permReportsEdit — gates the Edit button on an open report. */
  canEdit: boolean;
  /** Owner-only — deleting a report is permanent. */
  canDelete: boolean;
  /** permMembersView — involved-member badges link to member pages. */
  canViewMembers?: boolean;
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const viewing =
    mode?.type === "view"
      ? (reports.find((report) => report.id === mode.report.id) ?? mode.report)
      : null;
  const editing = mode?.type === "edit" ? mode.report : null;
  const listRef = useRef<HTMLDivElement>(null);
  // Keep link/sort in the URL; never sync the free-text search (who/what PII).
  const { query, setQuery, setFilter } = useUrlListState({ syncQueryToUrl: false });
  const filtered = useMemo(
    () => reports.filter((report) => matchesReportQuery(report, query)),
    [query, reports],
  );
  const paging = usePagedList(filtered, { resetKey: `${linkFilter}:${sortOrder}:${query}` });

  return (
    <>
      <AdminPageIntro
        action={
          canCreate ? (
            <Button className="w-full sm:w-auto" onClick={() => setMode({ type: "add" })}>
              Add report
            </Button>
          ) : null
        }
        description={intro.description}
        title={intro.title}
      />
      <div className="flex flex-col gap-4" ref={listRef}>
        {hasAnyReports ? (
          // Edge to edge (design D, as History): on phones the filters take a row under the search.
          <EdgeBar edgeTop>
            <EdgeSearch
              label="Search accident reports"
              onChange={setQuery}
              placeholder="Search by walk, people involved, or what happened…"
              stack
              value={query}
            />
            <EdgeFilters stack>
              <Select onValueChange={(value) => setFilter("link", value, "all")} value={linkFilter}>
                <SelectTrigger aria-label="Walk link" className={`${EDGE_FILTER} sm:w-[11rem]`} id="report-link-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reports</SelectItem>
                  <SelectItem value="linked">Linked to a walk</SelectItem>
                  <SelectItem value="unlinked">No linked walk</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setFilter("sort", value, "desc")} value={sortOrder}>
                <SelectTrigger aria-label="Sort" className={`${EDGE_FILTER} sm:w-[11rem]`} id="report-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </EdgeFilters>
          </EdgeBar>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-edge-bar="" data-edge-top="" />
        )}

        {!hasAnyReports ? (
          <EmptyState
            description="Add a report if something happens on a walk. You can print it to PDF afterwards."
            icon={ClipboardList}
            title="No accident reports yet"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            action={
              <ClearFiltersButton
                onClick={() => {
                  setQuery("");
                  if (linkFilter !== "all") setFilter("link", "all", "all");
                }}
              />
            }
            description="Try a different walk, name, or detail from the write-up."
            icon={Search}
            title="No matching reports"
          />
        ) : (
          <>
            <DataList>
              {paging.paged.map((report) => {
              const at = new Date(report.happenedAt);
              return (
                <DataListItem
                  className={cn("relative", dataListItemStackClassName)}
                  data-stagger-item=""
                  key={report.id}
                >
                  <DataListItemMain>
                    <DataListBody>
                      <p className="font-medium">
                        {/* The whole row opens the report. Fetched on hover or
                            touch, so it opens with its number already in the
                            header instead of a placeholder. */}
                        <IntentLink
                          className="after:absolute after:inset-0"
                          full
                          href={`/admin/reports/${report.id}`}
                        >
                          {report.reportNumber ? `${report.reportNumber} · ` : ""}
                          {formatWalkDay(at)} · {formatTime(at)}
                        </IntentLink>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.walkTitle || "No walk"}
                      </p>
                      <p className="line-clamp-3 text-sm text-muted-foreground wrap-break-word">
                        {report.whatHappened}
                      </p>
                    </DataListBody>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
                  </DataListItemMain>
                  <DataListActions className={cn("relative z-10", dataListActionsStackClassName)}>
                    <Button asChild size="xs" variant="outline">
                      <a
                        aria-label="Print report"
                        href={`/admin/reports/${report.id}/print`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Printer />
                        Print
                      </a>
                    </Button>
                    {canDelete ? <RemoveButton reportId={report.id} title={formatWalkDay(at)} /> : null}
                  </DataListActions>
                </DataListItem>
              );
              })}
            </DataList>
            <ListPagination
              noun="reports"
              onPageChange={paging.setPage}
              page={paging.page}
              pageCount={paging.pageCount}
              pageSize={paging.pageSize}
              scrollToRef={listRef}
              total={paging.total}
            />
          </>
        )}

        <Drawer
          closeDisabled={isPending}
          onOpenChange={(open) => {
            if (!open) setMode(null);
          }}
          open={mode !== null}
          variant="form"
        >
          <DrawerContent className="min-h-0">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>
                {mode?.type === "edit"
                  ? "Edit report"
                  : mode?.type === "view"
                    ? "Accident report"
                    : "Add a report"}
              </DrawerTitle>
              <DrawerDescription>
                {mode?.type === "edit"
                  ? "Change the details, then save."
                  : mode?.type === "view"
                    ? "The full write-up. Edit if something needs changing, or print a PDF."
                    : "Fill in what happened. You can print the report after it is saved."}
              </DrawerDescription>
            </DrawerHeader>
            {mode?.type === "add" ? (
              <AddForm
                key="add"
                onPendingChange={setIsPending}
                onSaved={() => setMode(null)}
                walks={createWalks}
              />
            ) : null}
            {viewing ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ReportReadView
                  canEdit={canEdit}
                  canViewMembers={canViewMembers}
                  report={viewing}
                />
                <DrawerFooter>
                  <Button asChild variant="outline">
                    <a
                      href={`/admin/reports/${viewing.id}/print`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Printer />
                      Print
                    </a>
                  </Button>
                  {canEdit ? (
                    <Button onClick={() => setMode({ type: "edit", report: viewing })} type="button">
                      Edit
                    </Button>
                  ) : null}
                </DrawerFooter>
              </div>
            ) : null}
            {editing ? (
              <EditForm
                key={editing.id}
                onCancel={() => setMode({ type: "view", report: editing })}
                onPendingChange={setIsPending}
                onSaved={() => setMode({ type: "view", report: editing })}
                report={editing}
                walks={walks}
              />
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

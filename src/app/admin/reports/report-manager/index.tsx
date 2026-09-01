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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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

export type { ReportView, WalkOption };

type DrawerMode =
  | { type: "add" }
  | { type: "view"; report: ReportView }
  | { type: "edit"; report: ReportView };

export function AccidentReportManager({
  reports,
  walks,
  hasAnyReports,
  linkFilter,
  sortOrder,
}: {
  /** Rows for the current link/sort filters — search is client-only (no PII in the URL). */
  reports: ReportView[];
  walks: WalkOption[];
  hasAnyReports: boolean;
  linkFilter: "all" | "linked" | "unlinked";
  sortOrder: "desc" | "asc";
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
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {hasAnyReports ? (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <InputGroup className="w-full min-w-0 sm:flex-1">
              <InputGroupInput
                aria-label="Search accident reports"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by walk, people involved, or what happened…"
                value={query}
              />
              <InputGroupAddon>
                <Search data-icon="inline-start" />
              </InputGroupAddon>
            </InputGroup>
            <div className="flex shrink-0 flex-col gap-1.5">
              <Label htmlFor="report-link-filter">Walk link</Label>
              <Select
                onValueChange={(value) => setFilter("link", value, "all")}
                value={linkFilter}
              >
                <SelectTrigger className="w-full sm:w-[11rem]" id="report-link-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reports</SelectItem>
                  <SelectItem value="linked">Linked to a walk</SelectItem>
                  <SelectItem value="unlinked">No linked walk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <Label htmlFor="report-sort">Sort</Label>
              <Select
                onValueChange={(value) => setFilter("sort", value, "desc")}
                value={sortOrder}
              >
                <SelectTrigger className="w-full sm:w-[11rem]" id="report-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        <Button className="w-full shrink-0 sm:w-auto" onClick={() => setMode({ type: "add" })} size="sm">
          Add report
        </Button>
      </div>

      {!hasAnyReports ? (
        <EmptyState
          description="Add a report if something happens on a walk. You can print it to PDF afterwards."
          icon={ClipboardList}
          title="No accident reports yet"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
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
                className={dataListItemStackClassName}
                key={report.id}
                onClick={() => setMode({ type: "view", report })}
              >
                <DataListItemMain>
                  <DataListBody>
                    <p className="font-medium">
                      {formatWalkDay(at)} · {formatTime(at)}
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
                <DataListActions className={dataListActionsStackClassName}>
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
                  <RemoveButton reportId={report.id} title={formatWalkDay(at)} />
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
        <DrawerContent className="min-h-0 sm:max-w-lg">
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
              walks={walks}
            />
          ) : null}
          {viewing ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <ReportReadView report={viewing} />
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
                <Button onClick={() => setMode({ type: "edit", report: viewing })} type="button">
                  Edit
                </Button>
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
  );
}

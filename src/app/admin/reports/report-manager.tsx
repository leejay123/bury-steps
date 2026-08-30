"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronRight, ClipboardList, Printer, Search, Trash2 } from "lucide-react";
import {
  addAccidentReport,
  deleteAccidentReport,
  updateAccidentReport,
  type ActionResult,
} from "@/server/actions";
import { formatWalkDay, formatTime, utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListActions, DataListBody, DataListItem, DataListItemMain, dataListActionsStackClassName, dataListItemStackClassName } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type ReportView = {
  id: string;
  happenedAt: string;
  walkId: string | null;
  walkTitle: string | null;
  walkLocation: string | null;
  whatHappened: string;
  whoInvolved: string;
  whatWeDid: string;
  organiserNotes: string | null;
};

export type WalkOption = { id: string; title: string; startsAt: string };

type DrawerMode =
  | { type: "add" }
  | { type: "view"; report: ReportView }
  | { type: "edit"; report: ReportView };

function ReportReadView({ report }: { report: ReportView }) {
  const at = new Date(report.happenedAt);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">When</p>
        <p className="text-sm">
          {formatWalkDay(at)} · {formatTime(at)}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Walk</p>
        <p className="text-sm">{report.walkTitle || "No linked walk"}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">What happened</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whatHappened}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Who was involved</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whoInvolved}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">What we did</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whatWeDid}
        </p>
      </div>
      {report.organiserNotes ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Organiser notes</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
            {report.organiserNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PendingSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ReportFields({
  prefix,
  report,
  walks,
}: {
  prefix: string;
  report?: ReportView;
  walks: WalkOption[];
}) {
  const [walkId, setWalkId] = useState(report?.walkId ?? "none");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 pb-2">
      {report ? <input name="reportId" type="hidden" value={report.id} /> : null}
      <input name="walkId" type="hidden" value={walkId === "none" ? "" : walkId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-happened`} required>
          When
        </Label>
        <DateTimePicker
          defaultValue={report ? utcToLondonWallClock(new Date(report.happenedAt)) : undefined}
          id={`${prefix}-happened`}
          name="happenedAt"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-walk`}>Walk (optional)</Label>
        <Select onValueChange={setWalkId} value={walkId}>
          <SelectTrigger id={`${prefix}-walk`}>
            <SelectValue placeholder="No linked walk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked walk</SelectItem>
            {walks.map((walk) => (
              <SelectItem key={walk.id} value={walk.id}>
                {walk.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-what`} required>
          What happened
        </Label>
        <Textarea
          className="min-h-24"
          defaultValue={report?.whatHappened}
          id={`${prefix}-what`}
          name="whatHappened"
          required
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-who`} required>
          Who was involved
        </Label>
        <Textarea
          className="min-h-20"
          defaultValue={report?.whoInvolved}
          id={`${prefix}-who`}
          name="whoInvolved"
          required
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-did`} required>
          What we did
        </Label>
        <Textarea
          className="min-h-24"
          defaultValue={report?.whatWeDid}
          id={`${prefix}-did`}
          name="whatWeDid"
          required
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-notes`}>Organiser notes</Label>
        <Textarea
          className="min-h-20"
          defaultValue={report?.organiserNotes ?? ""}
          id={`${prefix}-notes`}
          name="organiserNotes"
          rows={2}
        />
      </div>
    </div>
  );
}

function AddForm({
  onPendingChange,
  onSaved,
  walks,
}: {
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
  walks: WalkOption[];
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    addAccidentReport,
    null,
  );
  useActionToast(state, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);
  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <ReportFields prefix="add" walks={walks} />
      <FormError message={state && !state.ok ? state.error : null} />
      <DrawerFooter>
        <PendingSubmit label="Save report" pendingLabel="Saving…" />
      </DrawerFooter>
    </form>
  );
}

function EditForm({
  onCancel,
  onPendingChange,
  onSaved,
  report,
  walks,
}: {
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
  report: ReportView;
  walks: WalkOption[];
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateAccidentReport,
    null,
  );
  useActionToast(state, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);
  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <ReportFields prefix="edit" report={report} walks={walks} />
      <FormError message={state && !state.ok ? state.error : null} />
      <DrawerFooter>
        <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <PendingSubmit label="Save changes" pendingLabel="Saving…" />
      </DrawerFooter>
    </form>
  );
}

function RemoveReportConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

function RemoveButton({ reportId, title }: { reportId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button aria-label={`Remove report from ${title}`} size="xs" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveReportDialogForm
          key={session}
          onClose={() => setOpen(false)}
          reportId={reportId}
          title={title}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveReportDialogForm({
  onClose,
  reportId,
  title,
}: {
  onClose: () => void;
  reportId: string;
  title: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteAccidentReport, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this report?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="reportId" type="hidden" value={reportId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <RemoveReportConfirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

function matchesReportQuery(report: ReportView, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    report.whatHappened,
    report.whoInvolved,
    report.whatWeDid,
    report.organiserNotes ?? "",
    report.walkTitle ?? "",
    report.walkLocation ?? "",
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}

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
  const viewing = mode?.type === "view" ? mode.report : null;
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
              onSaved={() => setMode(null)}
              report={editing}
              walks={walks}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

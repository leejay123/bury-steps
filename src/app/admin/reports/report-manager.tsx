"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardList, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addAccidentReport,
  deleteAccidentReport,
  updateAccidentReport,
  type ActionResult,
} from "@/server/actions";
import { formatWalkDay, formatTime, utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  whatHappened: string;
  whoInvolved: string;
  whatWeDid: string;
  organiserNotes: string | null;
};

export type WalkOption = { id: string; title: string; startsAt: string };

type DrawerMode = { type: "add" } | { type: "edit"; report: ReportView };

function PendingSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

function useActionToast(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onOkRef.current?.();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);
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
    <div className="flex flex-col gap-3 overflow-y-auto px-4">
      {report ? <input name="reportId" type="hidden" value={report.id} /> : null}
      <input name="walkId" type="hidden" value={walkId === "none" ? "" : walkId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-happened`}>When</Label>
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
        <Label htmlFor={`${prefix}-what`}>What happened</Label>
        <Textarea
          defaultValue={report?.whatHappened}
          id={`${prefix}-what`}
          name="whatHappened"
          required
          rows={4}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-who`}>Who was involved</Label>
        <Textarea
          defaultValue={report?.whoInvolved}
          id={`${prefix}-who`}
          name="whoInvolved"
          required
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-did`}>What we did</Label>
        <Textarea
          defaultValue={report?.whatWeDid}
          id={`${prefix}-did`}
          name="whatWeDid"
          required
          rows={4}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-notes`}>Organiser notes</Label>
        <Textarea
          defaultValue={report?.organiserNotes ?? ""}
          id={`${prefix}-notes`}
          name="organiserNotes"
          rows={3}
        />
      </div>
    </div>
  );
}

function AddForm({ onSaved, walks }: { onSaved: () => void; walks: WalkOption[] }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addAccidentReport, null);
  useActionToast(state, onSaved);
  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <ReportFields prefix="add" walks={walks} />
      <DrawerFooter>
        <PendingSubmit label="Save report" pendingLabel="Saving…" />
      </DrawerFooter>
    </form>
  );
}

function EditForm({
  onSaved,
  report,
  walks,
}: {
  onSaved: () => void;
  report: ReportView;
  walks: WalkOption[];
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateAccidentReport,
    null,
  );
  useActionToast(state, onSaved);
  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <ReportFields prefix="edit" report={report} walks={walks} />
      <DrawerFooter>
        <PendingSubmit label="Save changes" pendingLabel="Saving…" />
      </DrawerFooter>
    </form>
  );
}

function RemoveButton({ reportId, title }: { reportId: string; title: string }) {
  const router = useRouter();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    deleteAccidentReport,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Removed.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button aria-label={`Remove report from ${title}`} size="xs" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this report?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="reportId" type="hidden" value={reportId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep it</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Remove
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AccidentReportManager({
  reports,
  walks,
}: {
  reports: ReportView[];
  walks: WalkOption[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const editing = mode?.type === "edit" ? mode.report : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button className="w-full sm:w-auto" onClick={() => setMode({ type: "add" })} size="sm">
          Add report
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          description="Add a report if something happens on a walk. You can print it to PDF afterwards."
          icon={ClipboardList}
          title="No accident reports yet"
        />
      ) : (
        <DataList>
          {reports.map((report) => {
            const at = new Date(report.happenedAt);
            return (
              <DataListItem
                className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3"
                key={report.id}
                onClick={() => setMode({ type: "edit", report })}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
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
                </div>
                <DataListActions className="justify-end border-t pt-2 sm:border-0 sm:pt-0">
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
      )}

      <Drawer
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit report" : "Add a report"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the details, then save. Print from the list if you need a PDF."
                : "Fill in what happened. You can print the report after it is saved."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddForm onSaved={() => setMode(null)} walks={walks} />
          ) : null}
          {editing ? (
            <EditForm
              key={editing.id}
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

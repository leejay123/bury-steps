"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardList, Printer } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <Button size="sm" variant="destructive">
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
        <Button onClick={() => setMode({ type: "add" })} size="sm">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Walk</TableHead>
              <TableHead>What happened</TableHead>
              <TableHead className="w-20 text-right">
                <span className="sr-only">Remove</span>
              </TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const at = new Date(report.happenedAt);
              return (
                <TableRow
                  className="relative cursor-pointer"
                  key={report.id}
                  onClick={() => setMode({ type: "edit", report })}
                >
                  <TableCell>{formatWalkDay(at)}</TableCell>
                  <TableCell>{formatTime(at)}</TableCell>
                  <TableCell>{report.walkTitle || "—"}</TableCell>
                  <TableCell className="max-w-[20rem] truncate">{report.whatHappened}</TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/admin/reports/${report.id}/print`} rel="noreferrer" target="_blank">
                          <Printer data-icon="inline-start" />
                          Print
                        </a>
                      </Button>
                      <RemoveButton
                        reportId={report.id}
                        title={formatWalkDay(at)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <ChevronRight className="size-4" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Drawer
        direction="right"
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
                ? "Change the details, then save. Print from the table if you need a PDF."
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

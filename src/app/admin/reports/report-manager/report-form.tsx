"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { addAccidentReport, updateAccidentReport, type ActionResult } from "@/server/actions";
import { utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrawerFooter } from "@/components/ui/drawer";
import type { ReportView, WalkOption } from "./types";

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

export function AddForm({
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

export function EditForm({
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

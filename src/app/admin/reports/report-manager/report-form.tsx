"use client";

import { useActionState, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Clock, Footprints, HeartPulse, NotebookPen, Users } from "lucide-react";
import {
  addAccidentReport,
  getWalkAttendeesForReportForm,
  updateAccidentReport,
  type ActionResult,
} from "@/server/actions";
import { utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrawerFooter } from "@/components/ui/drawer";
import type { InvolvedMember, ReportView, WalkOption } from "./types";

/** A form-section label: icon + text, consistent across every field here. */
function FieldLabel({
  children,
  htmlFor,
  icon: Icon,
  required,
}: {
  children: ReactNode;
  htmlFor: string;
  icon: ComponentType<{ className?: string }>;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} required={required}>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {children}
    </Label>
  );
}

/** Small uppercase divider between the "when/where" fields and the write-up
 * fields — the six fields used to read as one undifferentiated stack. */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="shrink-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {children}
      </p>
      <Separator className="flex-1" />
    </div>
  );
}

/**
 * Checklist of a linked walk's attendees, so "who was involved" can tag a
 * real member instead of only free text. Selections persist even if the
 * walk is later cleared or an already-tagged member has since dropped off
 * the walk's attendee list — they're merged into the shown list rather
 * than silently dropped.
 */
function InvolvedMembersField({
  prefix,
  initialMembers,
  walkId,
}: {
  prefix: string;
  initialMembers: InvolvedMember[];
  walkId: string;
}) {
  const [attendees, setAttendees] = useState<InvolvedMember[]>(initialMembers);
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialMembers.map((m) => m.id)));
  // Which walk's attendees `attendees` currently reflects — set only from
  // inside the fetch's .then() below (never synchronously in the effect
  // body), so "loading" derives cleanly from comparing it to `walkId`.
  const [loadedForWalkId, setLoadedForWalkId] = useState<string | null>(walkId === "none" ? "none" : null);
  const loading = walkId !== "none" && loadedForWalkId !== walkId;

  useEffect(() => {
    if (walkId === "none") return;
    let cancelled = false;
    getWalkAttendeesForReportForm(walkId).then((fetched) => {
      if (cancelled) return;
      setLoadedForWalkId(walkId);
      // Keep anyone already tagged even if they've since dropped off this
      // walk's attendee list, so re-selecting a walk never loses a tag
      // that was already saved.
      setAttendees((current) => {
        const merged = new Map(fetched.map((member) => [member.id, member]));
        for (const member of current) {
          if (selectedIds.has(member.id) && !merged.has(member.id)) merged.set(member.id, member);
        }
        return [...merged.values()];
      });
    });
    return () => {
      cancelled = true;
    };
    // selectedIds intentionally excluded — this only refetches when the
    // walk changes, not on every checkbox click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkId]);

  if (walkId === "none" && attendees.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading attendees…</p>
      ) : attendees.length === 0 ? (
        <p className="text-xs text-muted-foreground">No one clocked in on this walk yet.</p>
      ) : (
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto overscroll-y-contain rounded-md border p-2">
          {attendees.map((member) => (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm"
              htmlFor={`${prefix}-involved-${member.id}`}
              key={member.id}
            >
              <Checkbox
                checked={selectedIds.has(member.id)}
                id={`${prefix}-involved-${member.id}`}
                onCheckedChange={(checked) =>
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    if (checked) next.add(member.id);
                    else next.delete(member.id);
                    return next;
                  })
                }
              />
              {member.name}
            </label>
          ))}
        </div>
      )}
      {[...selectedIds].map((id) => (
        <input key={id} name="involvedMemberIds" type="hidden" value={id} />
      ))}
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

      <SectionHeading>Details</SectionHeading>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-happened`} icon={Clock} required>
          When
        </FieldLabel>
        <DateTimePicker
          defaultValue={report ? utcToLondonWallClock(new Date(report.happenedAt)) : undefined}
          id={`${prefix}-happened`}
          name="happenedAt"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-walk`} icon={Footprints}>
          Walk (optional)
        </FieldLabel>
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

      <SectionHeading>The report</SectionHeading>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-what`} icon={AlertTriangle} required>
          What happened
        </FieldLabel>
        <Textarea
          className="min-h-24"
          defaultValue={report?.whatHappened}
          id={`${prefix}-what`}
          name="whatHappened"
          placeholder="Slipped on a wet tree root near the bridge and twisted their ankle."
          required
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-who`} icon={Users}>
          Who was involved
        </FieldLabel>
        <InvolvedMembersField
          initialMembers={report?.involvedMembers ?? []}
          prefix={prefix}
          walkId={walkId}
        />
        <Textarea
          className="min-h-20"
          defaultValue={report?.whoInvolved}
          id={`${prefix}-who`}
          name="whoInvolved"
          placeholder="Anyone not tagged above — a passerby who isn't a member, say."
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-did`} icon={HeartPulse} required>
          What we did
        </FieldLabel>
        <Textarea
          className="min-h-24"
          defaultValue={report?.whatWeDid}
          id={`${prefix}-did`}
          name="whatWeDid"
          placeholder="Sat them down, checked the ankle, waited 10 minutes, then walked back slowly with support."
          required
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${prefix}-notes`} icon={NotebookPen}>
          Organiser notes
        </FieldLabel>
        <Textarea
          className="min-h-20"
          defaultValue={report?.organiserNotes ?? ""}
          id={`${prefix}-notes`}
          name="organiserNotes"
          placeholder="Anything for other organisers only — not shown to the member."
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

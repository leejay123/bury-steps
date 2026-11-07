"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import { AlertTriangle, Clock, Footprints, Hash, HeartPulse, NotebookPen, Users } from "lucide-react";
import { toast } from "sonner";
import {
  addAccidentReport,
  getWalkAttendeesForReportForm,
  updateAccidentReport,
} from "@/server/actions";
import { formatWalkDay, utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { useActionToast } from "@/hooks/use-action-toast";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvolvedMember, ReportView, WalkOption } from "./types";
import { DrawerFormFooter, useKeepFormOnError } from "@/components/drawer-form";

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
  pickNumberedFor,
  walkId,
}: {
  prefix: string;
  initialMembers: InvolvedMember[];
  /** On create, pick who the report number belongs to when several people are tagged. */
  pickNumberedFor: boolean;
  walkId: string;
}) {
  const [attendees, setAttendees] = useState<InvolvedMember[]>(initialMembers);
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialMembers.map((m) => m.id)));
  const [numberedForId, setNumberedForId] = useState("");
  const [numberedForMissing, setNumberedForMissing] = useState(false);
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
    }).catch(() => {
      // A dropped connection: stop "Loading attendees…" and say so. Anyone
      // already tagged stays tagged.
      if (cancelled) return;
      setLoadedForWalkId(walkId);
      toast.error("Could not load this walk’s attendees. Check your connection and try again.");
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
                    if (!next.has(numberedForId)) setNumberedForId("");
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
      {pickNumberedFor && selectedIds.size === 1 ? (
        <input name="numberedForMemberId" type="hidden" value={[...selectedIds][0]} />
      ) : null}
      {pickNumberedFor && selectedIds.size > 1 ? (
        <div className="flex flex-col gap-1.5 pt-1">
          <FieldLabel htmlFor={`${prefix}-numbered-for`} icon={Hash} required>
            Number this report for
          </FieldLabel>
          <Select
            onValueChange={(value) => {
              setNumberedForId(value);
              setNumberedForMissing(false);
            }}
            value={numberedForId || undefined}
          >
            <SelectTrigger id={`${prefix}-numbered-for`}>
              <SelectValue placeholder="Pick who this report is numbered for" />
            </SelectTrigger>
            <SelectContent>
              {attendees
                .filter((member) => selectedIds.has(member.id))
                .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {numberedForMissing ? (
            <p className="text-xs text-destructive">Pick who this report is numbered for.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The report number uses this person&apos;s initials. Everyone tagged stays on the report.
            </p>
          )}
          {/* Required, so Next and Save stop here until someone is picked —
              the message shows above rather than on this invisible box. */}
          <input
            aria-hidden
            className="sr-only"
            name="numberedForMemberId"
            onChange={() => {}}
            onInvalid={(event) => {
              event.preventDefault();
              setNumberedForMissing(true);
              document.getElementById(`${prefix}-numbered-for`)?.focus();
            }}
            required
            tabIndex={-1}
            value={numberedForId}
          />
        </div>
      ) : null}
    </div>
  );
}

/** The steps of Add a report, in order (their names show above each). */
const REPORT_STEPS = ["When and which walk", "What happened", "What we did"];

type ReportSteps = {
  step: number;
  go: (n: number) => void;
  /** Next, if the boxes on this step are filled in properly. */
  next: () => void;
  root: RefObject<HTMLDivElement | null>;
};

function ReportFields({
  prefix,
  report,
  steps,
  walks,
}: {
  prefix: string;
  report?: ReportView;
  /** Show one step at a time. Without it, every field shows at once. */
  steps?: ReportSteps;
  walks: WalkOption[];
}) {
  const [walkId, setWalkId] = useState(report?.walkId ?? "none");
  const [walkMissing, setWalkMissing] = useState(false);
  // Every step stays in the form while hidden, so all of it is sent with Save.
  const stepClass = (n: number) =>
    cn("flex flex-col gap-3", steps && steps.step !== n && "hidden");

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 pb-2"
      // Enter in a box goes to the next step instead of saving early.
      onKeyDown={(event) => {
        if (!steps || steps.step >= REPORT_STEPS.length - 1) return;
        const target = event.target as HTMLElement;
        if (event.key === "Enter" && target.tagName === "INPUT") {
          event.preventDefault();
          steps.next();
        }
      }}
      // Save with a required box empty on another step: open that step,
      // so the browser can point at the box.
      onInvalidCapture={(event) => {
        const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-report-step]");
        const n = Number(panel?.dataset.reportStep);
        if (steps && Number.isInteger(n) && n !== steps.step) steps.go(n);
      }}
      ref={steps?.root}
    >
      {report ? <input name="reportId" type="hidden" value={report.id} /> : null}
      <input name="walkId" type="hidden" value={walkId === "none" ? "" : walkId} />

      {steps ? (
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Step {steps.step + 1} of {REPORT_STEPS.length} · {REPORT_STEPS[steps.step]}
        </p>
      ) : null}
      <div className={stepClass(0)} data-report-step="0">
        {steps ? null : <SectionHeading>Details</SectionHeading>}
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
          <FieldLabel htmlFor={`${prefix}-walk`} icon={Footprints} required={Boolean(steps)}>
            {steps ? "Walk" : "Walk (optional)"}
          </FieldLabel>
          <Select
            disabled={steps ? walks.length === 0 : undefined}
            onValueChange={(value) => {
              setWalkId(value);
              setWalkMissing(false);
            }}
            value={steps && walkId === "none" ? "" : walkId}
          >
            <SelectTrigger id={`${prefix}-walk`}>
              <SelectValue placeholder={steps ? "Choose a walk" : "No linked walk"} />
            </SelectTrigger>
            <SelectContent>
              {steps ? null : <SelectItem value="none">No linked walk</SelectItem>}
              {walks.map((walk) => (
                <SelectItem key={walk.id} value={walk.id}>
                  {/* Newest first, with the day, so two walks with the same
                      title can be told apart. */}
                  {formatWalkDay(walk.startsAt)} · {walk.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {steps ? (
            // A new report must name its walk. The Select's button can't be
            // marked required, so this invisible box stops Next and Save, and
            // the message shows under the button (as DateTimePicker does).
            <input
              aria-hidden
              className="sr-only"
              onChange={() => {}}
              onInvalid={(event) => {
                event.preventDefault();
                setWalkMissing(true);
                document.getElementById(`${prefix}-walk`)?.focus();
              }}
              required
              tabIndex={-1}
              value={walkId === "none" ? "" : walkId}
            />
          ) : null}
          {steps && walks.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No walks to choose yet. A walk shows here once it has finished and someone attended it.
            </p>
          ) : walkMissing ? (
            <p className="text-xs text-destructive">Choose the walk this report is about.</p>
          ) : null}
        </div>
      </div>

      <div className={stepClass(1)} data-report-step="1">
        {steps ? null : <SectionHeading>The report</SectionHeading>}
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${prefix}-what`} icon={AlertTriangle} required>
            What happened
          </FieldLabel>
          <Textarea
            className="min-h-24"
            defaultValue={report?.whatHappened}
            id={`${prefix}-what`}
            minLength={3}
            name="whatHappened"
            placeholder="Slipped on a wet tree root near the bridge and twisted their ankle."
            required
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Required in the sense that one of the two must be filled: a
              tagged member or a name typed below. */}
          <FieldLabel htmlFor={`${prefix}-who`} icon={Users} required>
            Who was involved
          </FieldLabel>
          <InvolvedMembersField
            initialMembers={report?.involvedMembers ?? []}
            pickNumberedFor={!report}
            prefix={prefix}
            walkId={walkId}
          />
          <Textarea
            className="min-h-20"
            defaultValue={report?.whoInvolved}
            id={`${prefix}-who`}
            name="whoInvolved"
            placeholder={
              walkId === "none"
                ? "Who was hurt or helped — names, or a description if they aren't members."
                : "Anyone not tagged above — a passerby who isn't a member, say."
            }
            rows={2}
          />
        </div>
      </div>

      <div className={stepClass(2)} data-report-step="2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${prefix}-did`} icon={HeartPulse} required>
            What we did
          </FieldLabel>
          <Textarea
            className="min-h-24"
            defaultValue={report?.whatWeDid}
            id={`${prefix}-did`}
            minLength={3}
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
  const [state, action, isPending] = useSafeActionState(addAccidentReport);
  useActionToast(state, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);
  // Keeps everything typed if the save comes back with a problem.
  const submit = useKeepFormOnError(action);

  // One step at a time: Next until the last, then Save report.
  const [step, setStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    setStep(n);
    // Back to the top of the drawer for the new step.
    if (root.current) root.current.scrollTop = 0;
  };
  const next = () => {
    const panel = root.current?.querySelector<HTMLElement>(`[data-report-step="${step}"]`);
    const who = panel?.querySelector<HTMLTextAreaElement>('textarea[name="whoInvolved"]');
    who?.setCustomValidity("");
    const fields = Array.from(
      panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea") ?? [],
    );
    // The first box that isn't right says so (as Save would).
    const wrong = fields.find((field) => field.willValidate && !field.checkValidity());
    if (wrong) {
      wrong.reportValidity();
      return;
    }
    // Who was involved: a tagged member or a typed name will do, so neither
    // box can be marked required. Same rule and wording as the server, asked
    // here so it isn't only found out after the last step.
    if (who && !who.value.trim() && !panel?.querySelector('input[name="involvedMemberIds"]')) {
      who.setCustomValidity("Say who was involved, or tag at least one member.");
      who.reportValidity();
      return;
    }
    go(Math.min(step + 1, REPORT_STEPS.length - 1));
  };

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <ReportFields prefix="add" steps={{ step, go, next, root }} walks={walks} />
      <FormError message={state && !state.ok ? state.error : null} />
      {step === REPORT_STEPS.length - 1 ? (
        <DrawerFormFooter
          cancelLabel="Back"
          halves
          label="Save report"
          onCancel={() => go(step - 1)}
          pending={isPending}
          pendingLabel="Saving…"
        />
      ) : (
        // Two buttons, half the drawer's width each on every screen.
        <DrawerFooter className="grid grid-cols-2">
          {step === 0 ? (
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          ) : (
            <Button onClick={() => go(step - 1)} type="button" variant="outline">
              Back
            </Button>
          )}
          <Button onClick={next} type="button">
            Next
          </Button>
        </DrawerFooter>
      )}
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
  const [state, action, isPending] = useSafeActionState(updateAccidentReport);
  useActionToast(state, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);
  // Keeps everything typed if the save comes back with a problem.
  const submit = useKeepFormOnError(action);
  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <ReportFields prefix="edit" report={report} walks={walks} />
      <FormError message={state && !state.ok ? state.error : null} />
      <DrawerFormFooter label="Save changes" onCancel={onCancel} pending={isPending} pendingLabel="Saving…" />
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronRight } from "lucide-react";
import {
  createJourneyEvent,
  deleteJourneyEvent,
  updateJourneyEvent,
  type ActionResult,
} from "@/server/actions";
import { utcToLondonWallClock } from "@/lib/dates";
import {
  MAX_JOURNEY_BODY,
  MAX_JOURNEY_EVENTS,
  MAX_JOURNEY_TITLE,
  type JourneyEventView,
} from "@/lib/walk-journey";
import { useActionToast } from "@/hooks/use-action-toast";
import { DateTimePicker } from "@/components/date-time-picker";
import { FormError } from "@/components/form-error";
import { WalkJourneyTimeline } from "@/components/walk-journey-timeline";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

function RemoveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

type Mode = { type: "add" } | { type: "edit"; event: JourneyEventView };

export function WalkJourneyManager({
  canEdit,
  defaultHappenedAt,
  events,
  walkId,
}: {
  canEdit: boolean;
  defaultHappenedAt: string;
  events: JourneyEventView[];
  walkId: string;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [createState, createAction, createPending] = useActionState<ActionResult | null, FormData>(
    createJourneyEvent,
    null,
  );
  const [updateState, updateAction, updatePending] = useActionState<ActionResult | null, FormData>(
    updateJourneyEvent,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ActionResult | null, FormData>(
    deleteJourneyEvent,
    null,
  );
  const pending = createPending || updatePending || deletePending;
  useActionToast(createState, () => setMode(null));
  useActionToast(updateState, () => setMode(null));
  useActionToast(deleteState, () => setMode(null));

  const editing = mode?.type === "edit" ? mode.event : null;
  const formState = editing ? updateState : createState;
  const atCap = events.length >= MAX_JOURNEY_EVENTS;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Journey</h2>
          <p className="text-sm text-muted-foreground">
            Short moments from the walk — members open View journey on the walk link. Up to{" "}
            {MAX_JOURNEY_EVENTS}.
          </p>
        </div>
        {canEdit && !atCap ? (
          <Button onClick={() => setMode({ type: "add" })} size="sm" variant="outline">
            Add event
          </Button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <EmptyState
          description={
            canEdit
              ? "Add what happened on the walk — a cafe stop, a viewpoint, a funny moment."
              : "Nothing on this journey yet."
          }
          title="No journey events yet"
        />
      ) : (
        <>
          <WalkJourneyTimeline events={events} />
          {canEdit ? (
            <DataList>
              {events.map((event) => (
                <DataListItem key={event.id} onClick={() => setMode({ type: "edit", event })}>
                  <DataListBody>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.happenedAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      })}
                    </p>
                  </DataListBody>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </DataListItem>
              ))}
            </DataList>
          ) : null}
        </>
      )}

      <Drawer
        closeDisabled={pending}
        onOpenChange={(open) => {
          if (!open && !pending) setMode(null);
        }}
        open={mode !== null}
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit event" : "Add event"}</DrawerTitle>
            <DrawerDescription>
              Title and optional notes. Time is UK time on this walk’s day.
            </DrawerDescription>
          </DrawerHeader>
          <form action={editing ? updateAction : createAction} className="flex flex-col gap-4 px-4">
            <input name="walkId" type="hidden" value={walkId} />
            {editing ? <input name="eventId" type="hidden" value={editing.id} /> : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journey-title" required>
                Title
              </Label>
              <Input
                defaultValue={editing?.title ?? ""}
                id="journey-title"
                maxLength={MAX_JOURNEY_TITLE}
                name="title"
                placeholder="Stopped at Burrs cafe"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journey-body">Notes</Label>
              <Textarea
                defaultValue={editing?.body ?? ""}
                id="journey-body"
                maxLength={MAX_JOURNEY_BODY}
                name="body"
                placeholder="Optional — what happened"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journey-when" required>
                When
              </Label>
              <DateTimePicker
                defaultValue={
                  editing ? utcToLondonWallClock(editing.happenedAt) : defaultHappenedAt
                }
                id="journey-when"
                name="happenedAt"
                required
              />
            </div>
            <FormError message={formState && !formState.ok ? formState.error : null} />
            <DrawerFooter className="px-0">
              <Submit
                label={editing ? "Save changes" : "Add event"}
                pendingLabel={editing ? "Saving…" : "Adding…"}
              />
            </DrawerFooter>
          </form>
          {editing ? (
            <form action={deleteAction} className="border-t px-4 pt-4">
              <input name="eventId" type="hidden" value={editing.id} />
              <FormError message={deleteState && !deleteState.ok ? deleteState.error : null} />
              <DrawerFooter className="px-0">
                <RemoveSubmit />
              </DrawerFooter>
            </form>
          ) : null}
        </DrawerContent>
      </Drawer>
    </section>
  );
}

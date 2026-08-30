"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
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
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { DateTimePicker } from "@/components/date-time-picker";
import { FormError } from "@/components/form-error";
import { WalkJourneyDrawer } from "@/components/walk-journey-drawer";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
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

function RemoveConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

function RemoveJourneyEventButton({
  eventId,
  onRemoved,
  title,
}: {
  eventId: string;
  onRemoved: () => void;
  title: string;
}) {
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
        <Button aria-label={`Remove ${title}`} size="xs" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveJourneyEventDialogForm
          key={session}
          eventId={eventId}
          onClose={() => {
            setOpen(false);
            onRemoved();
          }}
          title={title}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveJourneyEventDialogForm({
  eventId,
  onClose,
  title,
}: {
  eventId: string;
  onClose: () => void;
  title: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteJourneyEvent, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this event?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” will be deleted from the journey. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="eventId" type="hidden" value={eventId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <RemoveConfirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
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
  const pending = createPending || updatePending;
  useActionToast(createState, () => setMode(null));
  useActionToast(updateState, () => setMode(null));

  const editing = mode?.type === "edit" ? mode.event : null;
  const formState = editing ? updateState : createState;
  const atCap = events.length >= MAX_JOURNEY_EVENTS;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Journey</h2>
          <p className="text-sm text-muted-foreground">
            Short moments from the walk. Preview opens the timeline in a drawer — same as members
            see. Up to {MAX_JOURNEY_EVENTS}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WalkJourneyDrawer events={events} />
          {canEdit && !atCap ? (
            <Button onClick={() => setMode({ type: "add" })} size="sm" variant="outline">
              <Plus data-icon="inline-start" />
              Add event
            </Button>
          ) : null}
        </div>
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
      ) : canEdit ? (
        <DataList>
          {events.map((event) => (
            <DataListItem
              className={dataListItemStackClassName}
              key={event.id}
              onClick={() => setMode({ type: "edit", event })}
            >
              <DataListItemMain>
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
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
              </DataListItemMain>
              <DataListActions className={dataListActionsStackClassName}>
                <RemoveJourneyEventButton
                  eventId={event.id}
                  onRemoved={() =>
                    setMode((current) =>
                      current?.type === "edit" && current.event.id === event.id ? null : current,
                    )
                  }
                  title={event.title}
                />
              </DataListActions>
            </DataListItem>
          ))}
        </DataList>
      ) : null}

      <Drawer
        closeDisabled={pending}
        onOpenChange={(open) => {
          if (!open && !pending) setMode(null);
        }}
        open={mode !== null}
        variant="form"
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit event" : "Add event"}</DrawerTitle>
            <DrawerDescription>
              Title and optional notes. Time is UK time on this walk’s day.
            </DrawerDescription>
          </DrawerHeader>
          <form
            action={editing ? updateAction : createAction}
            className="flex flex-col gap-4 px-4"
            key={editing?.id ?? "add"}
          >
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
        </DrawerContent>
      </Drawer>
    </section>
  );
}

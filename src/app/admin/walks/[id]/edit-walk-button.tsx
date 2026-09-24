"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { updateWalk, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { DrawerFormFooter } from "@/components/drawer-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WalkFormFields, type WalkFormDefaults } from "../../walk-form-fields";

function EditWalkForm({
  cancelled,
  defaults,
  onClose,
  onPendingChange,
  scheduleLocked,
  walkId,
}: {
  cancelled: boolean;
  defaults: WalkFormDefaults;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  scheduleLocked: boolean;
  walkId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateWalk,
    null,
  );
  useActionToast(state, onClose);

  useEffect(() => {
    onPendingChange(isPending);
  }, [isPending, onPendingChange]);

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <DrawerHeader className="shrink-0">
        <DrawerTitle>Edit walk</DrawerTitle>
        <DrawerDescription>
          {cancelled
            ? "Saving puts this walk back on the diary. If you change the title, copy the share link again."
            : "If you change the title, copy the share link again."}
        </DrawerDescription>
      </DrawerHeader>
      <input name="walkId" type="hidden" value={walkId} />
      <input name="wasCancelled" type="hidden" value={cancelled ? "on" : ""} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4 pb-4">
        <WalkFormFields
          defaults={defaults}
          idPrefix={`edit-${walkId}`}
          scheduleLocked={scheduleLocked}
        />
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
      <DrawerFormFooter
        label={cancelled ? "Save and reopen" : "Save changes"}
        pendingLabel="Saving…"
      />
    </form>
  );
}

/** Same drawer and fields as Create a walk (WalkFormFields), filled in
 * with this walk. */
export function EditWalkButton({
  cancelled,
  description,
  durationMins,
  latitude,
  location,
  longitude,
  postcode,
  scheduleLocked,
  startsAt,
  title,
  walkId,
  what3words,
}: {
  cancelled: boolean;
  description: string | null;
  durationMins: number;
  latitude: number | null;
  location: string | null;
  longitude: number | null;
  postcode: string | null;
  scheduleLocked: boolean;
  startsAt: string;
  title: string;
  walkId: string;
  what3words: string | null;
}) {
  const [open, setOpen] = useState(false);
  // A fresh form each time it opens, so a half-finished edit that was
  // cancelled never reappears.
  const [session, setSession] = useState(0);
  const [pending, setPending] = useState(false);

  return (
    <Drawer
      closeDisabled={pending}
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
      variant="form"
    >
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-0 sm:max-w-lg">
        <EditWalkForm
          cancelled={cancelled}
          defaults={{
            description,
            durationMins,
            latitude,
            location,
            longitude,
            postcode,
            startsAt,
            title,
            what3words,
          }}
          key={session}
          onClose={() => setOpen(false)}
          onPendingChange={setPending}
          scheduleLocked={scheduleLocked}
          walkId={walkId}
        />
      </DrawerContent>
    </Drawer>
  );
}

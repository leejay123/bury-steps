"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateContactMessagesOwner, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

const NO_ONE = "none";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function ContactMessagesOwnerSettings({
  currentOwnerId,
  organisers,
}: {
  currentOwnerId: string | null;
  organisers: { id: string; name: string }[];
}) {
  const initial = currentOwnerId ?? NO_ONE;
  const [ownerId, setOwnerId] = useState(initial);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateContactMessagesOwner,
    null,
  );
  useActionToast(state);

  useResetOnChange([initial], () => setOwnerId(initial));

  const dirty = ownerId !== initial;

  return (
    <SettingsSection
      description="Exactly one organiser gets emailed when someone submits the public contact form, and can reply straight from that email — instead of every organiser who's opted in."
      title="Contact messages"
    >
      <form action={action} className="flex w-full flex-col gap-4">
        <input name="contactMessagesOwnerId" type="hidden" value={ownerId === NO_ONE ? "" : ownerId} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-messages-owner">Alert and reply owner</Label>
          <Select onValueChange={setOwnerId} value={ownerId}>
            <SelectTrigger className="w-full sm:w-[16rem]" id="contact-messages-owner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ONE}>No one</SelectItem>
              {organisers.map((organiser) => (
                <SelectItem key={organiser.id} value={organiser.id}>
                  {organiser.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button onClick={() => setOwnerId(initial)} type="button" variant="outline">
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}

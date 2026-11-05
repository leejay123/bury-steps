"use client";

import { useState } from "react";
import { updateContactMessagesOwner } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection } from "../settings-page";
import { useSaveBar } from "@/components/save-bar";

const NO_ONE = "none";

export function ContactMessagesOwnerSettings({
  currentOwnerId,
  organisers,
}: {
  currentOwnerId: string | null;
  organisers: { id: string; name: string }[];
}) {
  const initial = currentOwnerId ?? NO_ONE;
  const [ownerId, setOwnerId] = useState(initial);
  const [state, action, pending, clearError] = useSafeActionState(updateContactMessagesOwner);
  useActionToast(state);

  useResetOnChange([initial], () => setOwnerId(initial));

  const dirty = ownerId !== initial;
  const form = useSaveBar(dirty, pending, () => {
    setOwnerId(initial);
    clearError();
  });

  return (
    <SettingsSection
      description="One organiser gets an email when someone sends the public contact form, and can reply straight from that email. Choose No one to stop these emails."
      title="Contact messages"
    >
      <form action={action} ref={form} className="flex w-full flex-col gap-4">
        <input name="contactMessagesOwnerId" type="hidden" value={ownerId === NO_ONE ? "" : ownerId} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-messages-owner">Who gets them</Label>
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
      </form>
    </SettingsSection>
  );
}

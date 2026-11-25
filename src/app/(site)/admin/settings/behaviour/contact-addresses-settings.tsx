"use client";

import { useState } from "react";
import { updateContactAddresses } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_TOPICS, MAX_CONTACT_EMAIL, type ContactTopic } from "@/lib/contact";
import { SettingsSection } from "../settings-page";
import { useSaveBar } from "@/components/save-bar";

export type ContactAddresses = Record<ContactTopic, string>;

const FIELD_NAME: Record<ContactTopic, string> = {
  CHAIR: "contactChairEmail",
  TREASURER: "contactTreasurerEmail",
  SECRETARY: "contactSecretaryEmail",
};

export function ContactAddressesSettings({ addresses }: { addresses: ContactAddresses }) {
  const [values, setValues] = useState(addresses);
  const [state, action, pending, clearError] = useSafeActionState(updateContactAddresses);
  useActionToast(state);

  useResetOnChange([addresses.CHAIR, addresses.TREASURER, addresses.SECRETARY], () => setValues(addresses));

  const dirty = CONTACT_TOPICS.some((topic) => values[topic.value] !== addresses[topic.value]);
  const form = useSaveBar(dirty, pending, () => {
    setValues(addresses);
    clearError();
  });

  return (
    <SettingsSection
      description="Visitors choose what their message is about on the Contact us form, and it is emailed to the matching address. Whoever reads that mailbox can reply straight from the email. Every message is also kept in Messages."
      title="Contact form addresses"
    >
      <form action={action} className="flex w-full flex-col gap-4" ref={form}>
        {CONTACT_TOPICS.map((topic) => (
          <div className="flex flex-col gap-2" key={topic.value}>
            <Label htmlFor={`contact-${topic.value}`}>{topic.role}</Label>
            <Input
              autoComplete="off"
              className="w-full sm:w-[24rem]"
              id={`contact-${topic.value}`}
              maxLength={MAX_CONTACT_EMAIL}
              name={FIELD_NAME[topic.value]}
              onChange={(event) => setValues((current) => ({ ...current, [topic.value]: event.target.value }))}
              required
              type="email"
              value={values[topic.value]}
            />
            <p className="text-sm text-muted-foreground">{topic.label}</p>
          </div>
        ))}
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}

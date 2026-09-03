"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitContactMessage, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CONTACT_MESSAGE, MAX_CONTACT_NAME, MAX_CONTACT_PHONE } from "@/lib/contact";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Sending…" : "Send message"}
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    submitContactMessage,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => formRef.current?.reset());

  return (
    <form action={action} className="flex w-full flex-col gap-4" ref={formRef}>
      {/* Honeypot — hidden from real visitors via CSS, not `type="hidden"`,
          so a bot's generic "fill every field" script still finds it. */}
      <div aria-hidden className="sr-only">
        <Label htmlFor="company">Company</Label>
        <Input autoComplete="off" id="company" name="company" tabIndex={-1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">Full name</Label>
        <Input id="contact-name" maxLength={MAX_CONTACT_NAME} name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" required type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-phone">Phone (optional)</Label>
        <Input
          id="contact-phone"
          maxLength={MAX_CONTACT_PHONE}
          name="phone"
          type="tel"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          maxLength={MAX_CONTACT_MESSAGE}
          name="message"
          required
          rows={5}
        />
      </div>
      <FormError message={state && !state.ok ? state.error : null} />
      <Submit />
    </form>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { getContactFormDefaults, submitContactMessage } from "@/server/actions";
import { useSignedInPromise } from "@/components/signed-in-context";
import { useActionToast } from "@/hooks/use-action-toast";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CONTACT_MESSAGE, MAX_CONTACT_NAME, MAX_CONTACT_PHONE, MIN_CONTACT_MESSAGE } from "@/lib/contact";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Sending…" : "Send message"}
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useSafeActionState(submitContactMessage);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const signedIn = useSignedInPromise();
  useActionToast(state, () => formRef.current?.reset());

  // A signed-in member's name and email go in for them, once the page
  // knows who they are — never over anything already typed. (The page is
  // the same ready-made one for everyone, so it can't arrive filled in.)
  useEffect(() => {
    let cancelled = false;
    // Promise.resolve: what React hands down is a bare "thenable" whose
    // then() can't be chained.
    void Promise.resolve(signedIn)
      .then((yes) => (yes ? getContactFormDefaults() : null))
      .then((defaults) => {
        if (cancelled || !defaults) return;
        // As the fields' starting values, so they also come back after the
        // form clears itself on a successful send.
        if (nameRef.current && !nameRef.current.value) nameRef.current.defaultValue = defaults.name;
        if (emailRef.current && !emailRef.current.value) emailRef.current.defaultValue = defaults.email;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

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
        <Input autoComplete="name" id="contact-name" maxLength={MAX_CONTACT_NAME} name="name" ref={nameRef} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input autoComplete="email" id="contact-email" name="email" ref={emailRef} required type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-phone">Phone (optional)</Label>
        <Input
          autoComplete="tel"
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
          minLength={MIN_CONTACT_MESSAGE}
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

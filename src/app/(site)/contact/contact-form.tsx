"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
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

function useContactForm() {
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

  return { state, action, formRef, nameRef, emailRef };
}

/** Honeypot — hidden from real visitors via CSS, not `type="hidden"`, so a bot's generic
    "fill every field" script still finds it. */
function Honeypot() {
  return (
    <div aria-hidden className="sr-only">
      <Label htmlFor="company">Company</Label>
      <Input autoComplete="off" id="company" name="company" tabIndex={-1} />
    </div>
  );
}

const FIELD = "cn-field group/field flex w-full cn-field-orientation-vertical flex-col *:w-full [&>.sr-only]:w-auto";
const FIELD_LABEL =
  "cn-label select-none items-center peer-disabled:cursor-not-allowed group-data-[disabled=true]:pointer-events-none cn-field-label group/field-label peer/field-label flex w-fit";
const FIELD_INPUT =
  "cn-input w-full min-w-0 outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function ShadcnSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      className="cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cn-button-size-default cn-button-variant-default rounded-[calc(var(--radius)*100)] max-sm:w-full"
      data-icon="inline-start"
      disabled={pending}
      type="submit"
    >
      <Send aria-hidden />
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

/**
 * The form laid out as shadcn.io's Contact page (their classes, used with permission):
 * edge to edge under the page head, "What happens next" on the left and the fields on
 * the right, the note and the Send button at the bottom.
 */
export function ShadcnContactForm({ steps }: { steps: string[] }) {
  const { state, action, formRef, nameRef, emailRef } = useContactForm();
  return (
    <form action={action} ref={formRef}>
      <Honeypot />
      <div className="grid grid-cols-1 border-t md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 p-5 max-md:border-b md:p-6">
          <h2 className="font-semibold">What happens next</h2>
          <ol className="grid gap-3.5">
            {steps.map((step, i) => (
              <li className="flex gap-3 text-sm leading-relaxed" key={step}>
                <span aria-hidden="true" className="font-mono text-muted-foreground text-xs tabular-nums leading-[inherit]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-pretty">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-6 p-5 md:border-s md:p-6">
          <div className="cn-field-group group/field-group @container/field-group flex w-full flex-col" data-slot="field-group">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={FIELD} data-orientation="vertical" data-slot="field" role="group">
                <label className={FIELD_LABEL} data-slot="field-label" htmlFor="contact-name">
                  Full name
                </label>
                <input
                  autoComplete="name"
                  className={FIELD_INPUT}
                  data-slot="input"
                  id="contact-name"
                  maxLength={MAX_CONTACT_NAME}
                  name="name"
                  placeholder="Your name"
                  ref={nameRef}
                  required
                  type="text"
                />
              </div>
              <div className={FIELD} data-orientation="vertical" data-slot="field" role="group">
                <label className={FIELD_LABEL} data-slot="field-label" htmlFor="contact-email">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className={FIELD_INPUT}
                  data-slot="input"
                  id="contact-email"
                  name="email"
                  placeholder="So we can reply"
                  ref={emailRef}
                  required
                  type="email"
                />
              </div>
            </div>
            <div className={FIELD} data-orientation="vertical" data-slot="field" role="group">
              <label className={FIELD_LABEL} data-slot="field-label" htmlFor="contact-phone">
                Phone (optional)
              </label>
              <input
                autoComplete="tel"
                className={FIELD_INPUT}
                data-slot="input"
                id="contact-phone"
                maxLength={MAX_CONTACT_PHONE}
                name="phone"
                placeholder="If you'd rather we called"
                type="tel"
              />
            </div>
            <div className={FIELD} data-orientation="vertical" data-slot="field" role="group">
              <label className={FIELD_LABEL} data-slot="field-label" htmlFor="contact-message">
                Message
              </label>
              <textarea
                aria-describedby="contact-message-note"
                className="cn-textarea field-sizing-content flex w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 min-h-40 resize-none"
                data-slot="textarea"
                id="contact-message"
                maxLength={MAX_CONTACT_MESSAGE}
                minLength={MIN_CONTACT_MESSAGE}
                name="message"
                placeholder="Tell us what's on your mind."
                required
              />
            </div>
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="cn-field-description font-normal leading-normal" data-slot="field-description" id="contact-message-note">
              Minimum {MIN_CONTACT_MESSAGE} characters.
            </p>
            <ShadcnSubmit />
          </div>
        </div>
      </div>
    </form>
  );
}

export function ContactForm() {
  const { state, action, formRef, nameRef, emailRef } = useContactForm();
  return (
    <form action={action} className="flex w-full flex-col gap-4" ref={formRef}>
      <Honeypot />
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

"use client";

import { useActionState, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { AtSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PAGE_X } from "@/lib/page-x";
import { subscribeToNewsletter, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Subscribing…" : "Subscribe"}
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}

/** Footer newsletter signup, backed by NewsletterSubscriber via Resend. */
export function NewsletterSignup() {
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    subscribeToNewsletter,
    null,
  );
  useActionToast(state, () => formRef.current?.reset());

  return (
    <div
      className={`relative flex w-full flex-col items-center gap-6 bg-secondary/80 py-10 dark:bg-secondary/40 ${PAGE_X}`}
    >
      <FullWidthDivider position="top" />
      <div className="space-y-1">
        <h2 className="text-center text-2xl font-semibold tracking-tight md:text-4xl">
          Subscribe to our newsletter
        </h2>
        <p className="text-center text-sm text-balance text-muted-foreground md:text-base">
          Occasional updates on walks and group news, straight to your inbox.
        </p>
      </div>
      <form action={action} className="flex items-center justify-center gap-2" ref={formRef}>
        {/* Honeypot — same pattern as the contact form. */}
        <div aria-hidden className="sr-only">
          <Label htmlFor={`${inputId}-company`}>Company</Label>
          <InputGroupInput autoComplete="off" id={`${inputId}-company`} name="company" tabIndex={-1} />
        </div>
        <Label className="sr-only" htmlFor={inputId}>
          Email address
        </Label>
        <InputGroup className="max-w-[280px] bg-card">
          <InputGroupAddon>
            <AtSign aria-hidden data-icon="inline-start" />
          </InputGroupAddon>
          <InputGroupInput id={inputId} name="email" placeholder="Enter your email" required type="email" />
        </InputGroup>
        <SubmitButton />
      </form>
      <FullWidthDivider position="bottom" />
    </div>
  );
}

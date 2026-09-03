"use client";

import { useId, useState } from "react";
import { AtSign, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { FullWidthDivider } from "@/components/full-width-divider";

/**
 * Footer newsletter signup. Not wired to an email service yet — submitting
 * just confirms the address was "captured" with a toast, so the UI reads as
 * finished while the group decides which provider to use. Swap the
 * onSubmit body for a real server action once that's picked.
 */
export function NewsletterSignup() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    // Placeholder until an email service (Brevo/Mailjet/etc.) is wired up.
    window.setTimeout(() => {
      setPending(false);
      setEmail("");
      toast.success("Thanks — we'll be in touch once newsletters are switched on.");
    }, 400);
  }

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 border-x bg-secondary/80 px-2 py-10 md:px-4 dark:bg-secondary/40">
      <FullWidthDivider position="top" />
      <div className="space-y-1">
        <h2 className="text-center text-2xl font-semibold tracking-tight md:text-4xl">
          Subscribe to our newsletter
        </h2>
        <p className="text-center text-sm text-balance text-muted-foreground md:text-base">
          Occasional updates on walks and group news, straight to your inbox.
        </p>
      </div>
      <form className="flex items-center justify-center gap-2" onSubmit={onSubmit}>
        <Label className="sr-only" htmlFor={inputId}>
          Email address
        </Label>
        <InputGroup className="max-w-[280px] bg-card">
          <InputGroupAddon>
            <AtSign aria-hidden data-icon="inline-start" />
          </InputGroupAddon>
          <InputGroupInput
            id={inputId}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            required
            type="email"
            value={email}
          />
        </InputGroup>
        <Button disabled={pending} type="submit">
          {pending ? "Subscribing…" : "Subscribe"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>
      <FullWidthDivider position="bottom" />
    </div>
  );
}

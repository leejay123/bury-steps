"use client";

import { useId, useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Subscribe to our newsletter</h2>
        <p className="text-sm text-muted-foreground">
          Occasional updates on walks and group news, straight to your inbox.
        </p>
      </div>
      <form className="flex w-full max-w-sm flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
        <Label className="sr-only" htmlFor={inputId}>
          Email address
        </Label>
        <InputGroup>
          <InputGroupAddon>
            <Mail aria-hidden className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id={inputId}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </InputGroup>
        <Button className="shrink-0" disabled={pending} type="submit">
          {pending ? "Subscribing…" : "Subscribe"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>
    </div>
  );
}

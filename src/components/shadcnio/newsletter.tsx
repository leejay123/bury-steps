"use client";

import { startTransition, useId, useRef, type FormEvent } from "react";
import { ArrowRight, AtSign } from "lucide-react";
import { subscribeToNewsletter } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { BUTTON_PRIMARY, Section } from "./parts";

/**
 * The site's newsletter sign-up (members only, as in the usual footer), drawn
 * as a shadcn.io section: the heading and line on the left, the form on the right.
 */
export function ShadcnNewsletter() {
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useSafeActionState(subscribeToNewsletter);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }
  useActionToast(state, () => formRef.current?.reset(), { toastErrors: true });

  return (
    <Section id="home-newsletter-heading">
      <div className="px-5 md:px-12 flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between md:gap-8 md:py-16">
        <div className="flex flex-col max-w-2xl gap-3 lg:gap-4">
          <h2 className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id="home-newsletter-heading">
            Subscribe to our newsletter
          </h2>
          <p className="text-pretty text-muted-foreground md:text-lg">
            <span className="font-medium text-foreground">Occasional updates on walks and group news,</span> straight to your
            inbox.
          </p>
        </div>
        <form className="flex w-full shrink-0 items-center gap-2 md:w-auto" onSubmit={submit} ref={formRef}>
          {/* Honeypot, as on the usual form. */}
          <div aria-hidden className="sr-only">
            <label htmlFor={`${inputId}-company`}>Company</label>
            <input autoComplete="off" id={`${inputId}-company`} name="company" tabIndex={-1} />
          </div>
          <label className="sr-only" htmlFor={inputId}>
            Email address
          </label>
          <span className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[calc(var(--radius)*100)] border bg-background px-4 focus-within:ring-2 focus-within:ring-ring md:w-72 md:flex-none">
            <AtSign aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              id={inputId}
              name="email"
              placeholder="Enter your email"
              required
              type="email"
            />
          </span>
          <button className={`${BUTTON_PRIMARY} gap-2`} disabled={pending} type="submit">
            {pending ? "Subscribing…" : "Subscribe"}
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </Section>
  );
}

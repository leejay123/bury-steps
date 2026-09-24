"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";

/**
 * The pieces every form drawer is built from, so they all read and behave
 * the same: a fixed button bar (DrawerFormFooter), one-line field hints
 * (FieldHint), small section headings in longer forms (FormSection), and
 * rarely needed fields tucked behind one "More options" link (MoreOptions).
 *
 * Follows the usual guidance for forms in drawers and sheets: the header
 * and button bar stay put while only the fields scroll; hints are a short
 * sentence at most (GOV.UK Design System); optional extras are revealed on
 * request rather than shown to everyone (progressive disclosure).
 */

/** The drawer's fixed button bar — Cancel, then the main action. Side by
 * side everywhere: two equal halves on a phone (one row instead of two,
 * leaving more room for the fields), right-aligned from the sm breakpoint
 * up. Both lock while the form is sending. */
export function DrawerFormFooter({
  cancelLabel = "Cancel",
  disabled,
  label,
  onCancel,
  pendingLabel,
}: {
  cancelLabel?: string;
  disabled?: boolean;
  label: string;
  /** Cancel does this instead of closing the drawer — e.g. going back
   * from editing an accident report to reading it. */
  onCancel?: () => void;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const cancel = (
    <Button disabled={pending} onClick={onCancel} type="button" variant="outline">
      {cancelLabel}
    </Button>
  );
  return (
    <DrawerFooter className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-end">
      {onCancel ? cancel : <DrawerClose asChild>{cancel}</DrawerClose>}
      <Button disabled={pending || disabled} type="submit">
        {pending ? pendingLabel : label}
      </Button>
    </DrawerFooter>
  );
}

/** One short line under a field. Give it the id the field points at with
 * aria-describedby, so a screen reader reads it after the label. */
export function FieldHint({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p className="text-xs text-muted-foreground" id={id}>
      {children}
    </p>
  );
}

/** A small heading ("When", "Where", …) that splits a long form into
 * parts you can scan. */
export function FormSection({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-4", className)}>
      <legend className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Fields most people never need, behind one clearly labelled link. A
 * native <details>, so it works without JavaScript and screen readers
 * announce it as expandable. The fields inside stay part of the form while
 * it's closed, so their values are still submitted. Opens with a height
 * animation where the browser supports animating to `auto` (Chrome,
 * Safari 26+ — see `.more-options` in globals.css); elsewhere it simply
 * opens straight away.
 *
 * `defaultOpen` — start open, e.g. when editing something that already
 * has one of these filled in, so it's never hidden from the person
 * who set it.
 */
export function MoreOptions({
  children,
  defaultOpen = false,
  label = "More options",
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="more-options group/more"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden
          className="size-4 transition-transform group-open/more:rotate-180 motion-reduce:transition-none"
        />
        {label}
      </summary>
      <div className="flex flex-col gap-4 pt-3">{children}</div>
    </details>
  );
}

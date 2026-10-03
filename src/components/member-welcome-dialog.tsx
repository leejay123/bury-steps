"use client";

import { useEffect, useState } from "react";
import { Footprints, LogOut, MapPinned } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dismissMemberWelcome } from "@/server/actions";

const SEEN_KEY_PREFIX = "bs_welcome_seen:";

const STEPS = [
  {
    icon: MapPinned,
    title: "Find a walk",
    description: "Tap a walk on this page to see the full details — where, when, and how long.",
  },
  {
    icon: Footprints,
    title: "Clock in on the day",
    description:
      "Clock-in opens an hour before the start time. Open the walk and tap Clock in so the organiser knows you're there.",
  },
  {
    icon: LogOut,
    title: "Clock out when you leave",
    description: "Open the walk again and tap Clock out. It's a separate step, so it's never by accident.",
  },
];

function MemberWelcomeDialogContent({
  firstName,
  onDismiss,
}: {
  firstName?: string | null;
  onDismiss: () => void;
}) {
  const greeting = firstName?.trim()
    ? `Welcome to Bury Steps, ${firstName.trim()}`
    : "Welcome to Bury Steps";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{greeting}</DialogTitle>
        <DialogDescription>Here&apos;s how clocking in works.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <div className="flex items-start gap-3" key={step.title}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <step.icon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={onDismiss} type="button">
          Got it
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Shown once, the first time a new member with no walks yet opens Walks.
 * Dismissing it is saved on the account (`welcomeSeenAt`), so it does not
 * come back on another phone or the next visit. localStorage is only a
 * same-browser backup for the moment before that save lands.
 *
 * The browser flag is keyed by `userId`, not a single fixed key — otherwise
 * dismissing it once in a browser would hide it forever for every future
 * account signed into that same browser, including a brand-new account
 * created after the original one was deleted (a real case on a shared/test
 * device, since a deleted-then-recreated account gets a fresh id here).
 */
export function MemberWelcomeDialog({
  firstName,
  hasNoWalks,
  userId,
}: {
  firstName?: string | null;
  hasNoWalks: boolean;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const seenKey = `${SEEN_KEY_PREFIX}${userId}`;

  useEffect(() => {
    if (!hasNoWalks) return;
    try {
      if (window.localStorage.getItem(seenKey)) return;
    } catch {
      // Storage may be unavailable (private mode); just show it once per tab.
    }
    // localStorage isn't available on the server, so this can only be
    // checked client-side, after mount — not a plain prop/state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [hasNoWalks, seenKey]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(seenKey, "1");
    } catch {
      // Ignore — the account flag below is what actually sticks.
    }
    void dismissMemberWelcome();
  }

  return (
    <Dialog onOpenChange={(next) => (next ? setOpen(true) : dismiss())} open={open}>
      <DialogContent showCloseButton={false}>
        <MemberWelcomeDialogContent firstName={firstName} onDismiss={dismiss} />
      </DialogContent>
    </Dialog>
  );
}

/** Organiser preview — same dialog content, does not set localStorage. */
export function PreviewMemberWelcomeDialog({ firstName }: { firstName?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        Preview welcome dialog
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent showCloseButton={false}>
          <MemberWelcomeDialogContent firstName={firstName} onDismiss={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

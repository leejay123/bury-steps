"use client";

import { useSyncExternalStore } from "react";
import { UserButton } from "@clerk/nextjs";
import { Bell, History, LineChart, Mail } from "lucide-react";
import { openEmailPreferences } from "@/components/email-preferences-drawer";

/**
 * Shortcuts into the same avatar menu Clerk already renders ("Manage
 * account", "Sign out") — reachable from any page without hunting through
 * the mobile nav's scrolling row.
 *
 * Must be its own client component, not inline JSX inside SiteNav (a server
 * component): Clerk's UserButton finds UserButton.MenuItems/.Link by
 * inspecting its children's component identity at runtime, and that
 * identity is lost once children are constructed server-side and passed
 * across the server/client boundary — the menu items silently don't
 * render (no error, just missing) if this lives in a server component.
 */
export function SiteUserButton({
  initial,
  progressEnabled = true,
}: {
  /** Shown in a circle until Clerk's avatar loads, so the header doesn't jump. */
  initial?: string;
  progressEnabled?: boolean;
}) {
  // The server always draws the initial circle (Clerk isn't loaded there).
  // If Clerk finishes loading in the browser before this part of the page
  // wakes up, drawing the real button straight away wouldn't match the
  // server's HTML (a hydration error). So draw the circle first, then swap.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const placeholder = (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase"
    >
      {initial}
    </span>
  );
  if (!hydrated) return placeholder;

  return (
    <UserButton fallback={placeholder}>
      <UserButton.MenuItems>
        {progressEnabled ? (
          <UserButton.Link href="/progress" label="Progress" labelIcon={<LineChart className="size-4" />} />
        ) : null}
        <UserButton.Link href="/history" label="History" labelIcon={<History className="size-4" />} />
        <UserButton.Action
          label="Email preferences"
          labelIcon={<Bell className="size-4" />}
          onClick={openEmailPreferences}
        />
        <UserButton.Link href="/contact" label="Contact us" labelIcon={<Mail className="size-4" />} />
      </UserButton.MenuItems>
    </UserButton>
  );
}

function noopSubscribe() {
  return () => {};
}

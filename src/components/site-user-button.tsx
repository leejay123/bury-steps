"use client";

import { UserButton } from "@clerk/nextjs";
import { FileText, History, LineChart, Mail, Shield } from "lucide-react";

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
export function SiteUserButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link href="/progress" label="Progress" labelIcon={<LineChart className="size-4" />} />
        <UserButton.Link href="/history" label="History" labelIcon={<History className="size-4" />} />
        <UserButton.Link href="/contact" label="Contact us" labelIcon={<Mail className="size-4" />} />
        <UserButton.Link href="/privacy-policy" label="Privacy policy" labelIcon={<Shield className="size-4" />} />
        <UserButton.Link
          href="/terms-of-service"
          label="Terms of service"
          labelIcon={<FileText className="size-4" />}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}

"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useClientPathname } from "@/components/client-pathname";
import {
  AVATAR_COOKIE,
  AVATAR_IMAGE_COOKIE,
  NAV_COOKIE,
  avatarImageSrc,
  parseRememberedNav,
} from "@/lib/remembered-nav";
import { leaveDashboardView } from "@/components/dashboard/dashboard-view";
import { ShellNavProvider } from "./shell-nav";
import { AppShell as AppShell1 } from "./shell-1/app-shell";
import { AppShell as AppShell2 } from "./shell-2/app-shell";
import { AppShell as AppShell3 } from "./shell-3/app-shell";
import { AppShell as AppShell4 } from "./shell-4/app-shell";

const SHELLS = { "1": AppShell1, "2": AppShell2, "3": AppShell3, "4": AppShell4 } as const;

/** Whether <html data-view="dashboard"> is set (it changes when Dashboard / Back to the site is pressed). */
function useDashboardView(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-view"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute("data-view") === "dashboard",
    () => false,
  );
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * The dashboard view (a test alongside the normal site): every page inside
 * Efferd's app shell — its side menu, top bar and avatar menu — in the design
 * chosen under Settings → Branding → Dashboard design. Off, the page is drawn
 * as normal. The menu and the avatar come from the cookies the site's own
 * header already keeps, so nothing extra is fetched.
 */
export function DashboardFrame({
  design,
  signOut,
  children,
}: {
  design: string;
  signOut: ReactNode;
  children: ReactNode;
}) {
  const on = useDashboardView();
  const pathname = useClientPathname() ?? "/";
  // Read only in the browser (the view is never on during the server render).
  const menu = on ? parseRememberedNav(readCookie(NAV_COOKIE)) : [];

  // Signed out (no menu any more): back to the normal site.
  useEffect(() => {
    if (on && menu.length === 0) leaveDashboardView();
  }, [on, menu.length]);

  if (!on || menu.length === 0) return children;

  let initial = "?";
  try {
    initial = decodeURIComponent(readCookie(AVATAR_COOKIE) ?? "").charAt(0).toUpperCase() || "?";
  } catch {}
  const user = {
    name: "Account",
    email: "",
    avatar: avatarImageSrc(readCookie(AVATAR_IMAGE_COOKIE)) ?? "",
    initial,
  };
  const AppShell = SHELLS[design as keyof typeof SHELLS] ?? AppShell1;
  return (
    <ShellNavProvider menu={menu} pathname={pathname} signOut={signOut} user={user}>
      <AppShell>{children}</AppShell>
    </ShellNavProvider>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, History, LineChart, LogOut, Mail, UserRound } from "lucide-react";
import { AvatarPlaceholder } from "@/components/header-placeholders";
import { IntentLink as Link } from "@/components/intent-link";
import { openEmailPreferences } from "@/components/email-preferences-drawer";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVATAR_IMAGE_COOKIE } from "@/lib/remembered-nav";
import { writeClientCookie } from "@/lib/remembered-rows-key";

/**
 * The avatar and its account menu, drawn by the site rather than Clerk's
 * UserButton (Clerk only signs out, and runs the Account page's editor). A
 * dropdown under the avatar on larger screens; on a phone the same list rises
 * from the bottom as the site's other panels do. The avatar is the remembered
 * photo from the first paint, so nothing is swapped when Clerk loads.
 * Clerk's own pattern: https://clerk.com/components/user-button (useUser +
 * useClerk with your own menu).
 */
export function SiteUserButton({
  image,
  initial,
  progressEnabled = true,
}: {
  /** Last visit's photo, shown from the first paint. */
  image?: string | null;
  /** Shown in the circle when there's no photo. */
  initial?: string;
  progressEnabled?: boolean;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);

  // Remember the photo so the next refresh can show it straight away.
  const imageUrl = user?.imageUrl;
  useEffect(() => {
    if (imageUrl) writeClientCookie(AVATAR_IMAGE_COOKIE, encodeURIComponent(imageUrl));
  }, [imageUrl]);

  // The server draws the remembered photo (Clerk isn't loaded there); keep it until this
  // part of the page has woken up, so the browser's first draw matches the server's.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const photo = (hydrated ? imageUrl : null) ?? image ?? null;
  const name = user?.fullName || user?.firstName || "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const links: { href: string; label: string; icon: ReactNode }[] = [
    ...(progressEnabled ? [{ href: "/progress", label: "Progress", icon: <LineChart /> }] : []),
    { href: "/history", label: "History", icon: <History /> },
    { href: "/contact", label: "Contact us", icon: <Mail /> },
  ];
  const emailPreferences = () => {
    setOpen(false);
    openEmailPreferences();
  };
  const leave = () => {
    setOpen(false);
    void signOut({ redirectUrl: "/" });
  };

  const avatar = (
    <button
      aria-label="Open account menu"
      data-account-button=""
      className="relative flex size-7 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      type="button"
    >
      <AvatarPlaceholder image={photo} initial={initial || name.charAt(0) || "?"} />
    </button>
  );

  if (phone) {
    return (
      <>
        <span className="contents" onClick={() => setOpen(true)}>
          {avatar}
        </span>
        <Drawer direction="bottom" onOpenChange={setOpen} open={open}>
          <DrawerContent>
            <DrawerHeader className="border-b text-left">
              <DrawerTitle>{name || "Your account"}</DrawerTitle>
              {email ? <DrawerDescription>{email}</DrawerDescription> : null}
            </DrawerHeader>
            <nav aria-label="Account" className="flex flex-col p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {links.map((link) => (
                <Link className={PHONE_ROW} href={link.href} key={link.href} onClick={() => setOpen(false)}>
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <button className={PHONE_ROW} onClick={emailPreferences} type="button">
                <Bell />
                Email preferences
              </button>
              <div className="-mx-2 my-2 h-px bg-border" />
              <Link className={PHONE_ROW} href="/account" onClick={() => setOpen(false)}>
                <UserRound />
                Manage account
              </Link>
              <button className={PHONE_ROW} onClick={leave} type="button">
                <LogOut />
                Sign out
              </button>
            </nav>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>{avatar}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case tracking-normal">
          <span className="truncate text-sm font-medium text-foreground">{name || "Your account"}</span>
          {email ? <span className="truncate text-xs font-normal text-muted-foreground">{email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((link) => (
          <DropdownMenuItem asChild key={link.href}>
            <Link href={link.href}>
              {link.icon}
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={emailPreferences}>
          <Bell />
          Email preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound />
            Manage account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={leave}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PHONE_ROW =
  "flex h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-base hover:bg-muted [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

function useIsPhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);
}
const PHONE = "(max-width: 639px)";
function subscribePhone(change: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

function noopSubscribe() {
  return () => {};
}

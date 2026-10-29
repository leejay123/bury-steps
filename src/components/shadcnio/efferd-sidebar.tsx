import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, ChevronsUpDown, Mail } from "lucide-react";
import { ClerkIsland } from "@/components/clerk-island";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { AvatarPlaceholder, BellPlaceholder } from "@/components/header-placeholders";
import { HeaderPartBoundary } from "@/components/header-part-boundary";
import { SiteNavBell } from "@/components/site-nav";
import { getOptionalUser } from "@/lib/auth";
import { getProgressEnabled } from "@/lib/progress-settings";
import { sidebarGroups } from "./dash-sidebar";
import { EfferdNav } from "./efferd-nav";
import { getShadcnHomeData } from "./home-data";
import { SignedInMark } from "./signed-in-mark";

/*
 * Efferd's app shell 2 (their layout and classes, from the efferd.com block the
 * site already uses for its dashboard view) for every signed-in page in the
 * shadcn.io design, in the site's own light and dark colours: a full-height
 * sidebar that folds to icons, and a top bar with the sidebar button, the page's
 * name, the notices bell and the avatar (site-shell.tsx places them).
 */

/** The sidebar's logo row (the same for everyone, so it's in the ready-made page). */
export function EfferdSidebarHead({ siteName, logoSrc }: { siteName: string; logoSrc: string }) {
  return (
    <div className="flex h-14 shrink-0 items-center border-b px-2">
      <Link
        aria-label={`${siteName}, back to home`}
        className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-hidden hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        data-efferd-button=""
        href="/"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="size-7 shrink-0 rounded-full object-contain" src={logoSrc} />
      </Link>
    </div>
  );
}

/** The menu and the footer, for whoever is signed in. */
export async function EfferdSidebarBody() {
  const [user, groups, data, progressEnabled] = await Promise.all([
    getOptionalUser(),
    sidebarGroups(),
    getShadcnHomeData(),
    getProgressEnabled(),
  ]);
  // Signed out: no sidebar, ever.
  if (!user || !groups) return <SignedInMark signedIn={false} />;
  const organiser = user.role === "ADMIN";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]!;
  const initial = (user.firstName || user.email || "?").charAt(0);
  const next = data.next ? data.upcoming[0] : null;
  return (
    <>
      <SignedInMark signedIn />
      <EfferdNav groups={groups} />
      <div className="flex shrink-0 flex-col" data-efferd-foot="">
        {next ? (
          // Efferd's "latest change" card, here the next walk.
          <div className="relative flex min-h-27 flex-col justify-center gap-1 overflow-hidden border-t px-4 pt-3 pb-1 *:text-nowrap" data-efferd-label="">
            <span className="font-light font-mono text-[10px] text-muted-foreground">NEXT WALK</span>
            <p className="truncate font-medium text-xs">{next.title}</p>
            <span className="truncate text-[10px] text-muted-foreground">{next.when}</span>
            <Link className="w-max py-1.5 font-light text-xs underline-offset-4 hover:underline" href={next.href}>
              See the walk
            </Link>
          </div>
        ) : null}
        <ul className="flex flex-col gap-1 border-t p-2">
          <li>
            <Link
              className="flex h-7 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-muted-foreground text-xs hover:bg-muted hover:text-foreground [&>svg]:size-4 [&>svg]:shrink-0"
              data-efferd-button=""
              href="/contact"
              title="Contact us"
            >
              <Mail aria-hidden />
              <span className="truncate">Contact us</span>
            </Link>
          </li>
          {organiser ? (
            <li>
              <Link
                className="flex h-7 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-muted-foreground text-xs hover:bg-muted hover:text-foreground [&>svg]:size-4 [&>svg]:shrink-0"
                data-efferd-button=""
                href="/admin/guide"
                title="Organiser guide"
              >
                <BookOpen aria-hidden />
                <span className="truncate">Organiser guide</span>
              </Link>
            </li>
          ) : null}
        </ul>
        {/* The person, as in Efferd's shell: their photo, name and email; the whole row opens
            their account menu (the photo's button covers it). */}
        <div className="border-t p-2">
          <div
            className="relative flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm hover:bg-muted [&_button]:after:absolute [&_button]:after:inset-0 [&_button]:after:content-['']"
            data-efferd-button=""
            title={name}
          >
            <ClerkIsland>
              <LazySiteUserButton image={user.imageUrl} initial={initial} progressEnabled={progressEnabled} />
            </ClerkIsland>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium text-foreground">{name}</span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </div>
        </div>
      </div>
    </>
  );
}

/** The top bar's right end: the notices bell and the avatar menu. */
async function EfferdTools() {
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  if (!user) return null;
  const initial = (user.firstName || user.email || "?").charAt(0);
  return (
    <>
      <HeaderPartBoundary name="bell">
        <Suspense fallback={<BellPlaceholder />}>
          <SiteNavBell firstName={user.firstName} userId={user.id} />
        </Suspense>
      </HeaderPartBoundary>
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
      <HeaderPartBoundary fallback={<AvatarPlaceholder initial={initial} />} name="account-menu">
        <ClerkIsland>
          <LazySiteUserButton image={user.imageUrl} initial={initial} progressEnabled={progressEnabled} />
        </ClerkIsland>
      </HeaderPartBoundary>
    </>
  );
}

export function EfferdHeaderTools() {
  return (
    <Suspense
      fallback={
        <>
          <BellPlaceholder />
          <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
          <AvatarPlaceholder />
        </>
      }
    >
      <EfferdTools />
    </Suspense>
  );
}

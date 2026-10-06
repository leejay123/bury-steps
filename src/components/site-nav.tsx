import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { navItems } from "@/components/site-nav-items";
import {
  AVATAR_IMAGE_COOKIE,
  NAV_COOKIE,
  UNREAD_COOKIE,
  parseRememberedAvatar,
  parseRememberedNav,
  parseRememberedUnread,
} from "@/lib/remembered-nav";
import { RememberHeader } from "@/components/remember-header";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { getSiteTheme } from "@/lib/site-theme";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { ClerkIsland } from "@/components/clerk-island";
import { JoinGroupButton } from "@/components/join-group-button";
import { SiteNavLinks, SiteMobileMenu, type MobileMenuGroup } from "@/components/site-nav-menu";
import { AvatarPlaceholder, BellPlaceholder } from "@/components/header-placeholders";
import { HEADER_NAV_COLUMN_CLASS, HEADER_TOOLS_CLASS } from "@/components/header-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { SiteSearchBar, SiteSearchDialog } from "@/components/site-search";
import { EmailPreferencesDrawer } from "@/components/email-preferences-drawer";
import { getSiteNoticeState } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";

/** What the header remembers from last visit (cookies), for its placeholders. */
type RememberedHeader = {
  avatar: { clerkId: string; url: string } | null;
  /** Whether the visitor is on a Mac, iPhone or iPad (⌘K rather than Ctrl K). */
  apple: boolean;
  unread: number;
};

/** Cookie read stays inside Suspense so the shared layout can still be prerendered. */
export async function SiteNavSlot() {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  const remembered: RememberedHeader = {
    avatar: parseRememberedAvatar(jar.get(AVATAR_IMAGE_COOKIE)?.value),
    apple: /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(head.get("user-agent") ?? ""),
    unread: parseRememberedUnread(jar.get(UNREAD_COOKIE)?.value),
  };
  const remembersMenu = parseRememberedNav(jar.get(NAV_COOKIE)?.value).length > 0;
  return (
    <Suspense fallback={<SiteNavFallback remembersMenu={remembersMenu} />}>
      <SiteNav remembered={remembered} />
    </Suspense>
  );
}

/**
 * Until the session is known. A returning member's header is already drawn
 * from last visit's cookies by the script in header-boot.tsx, so this stays
 * out of the way (it would only cover that copy with an identical one).
 * Otherwise it holds the header's columns open.
 */
export function SiteNavFallback({ remembersMenu = false }: { remembersMenu?: boolean }) {
  if (remembersMenu) return null;
  return (
    <>
      <div className={HEADER_NAV_COLUMN_CLASS} />
      <div className={HEADER_TOOLS_CLASS} />
    </>
  );
}

// The bell's notices load separately so they never hold up the rest of the
// header (links, search, avatar), which render as soon as the user is known.
async function SiteNavBell({ firstName, userId }: { firstName: string | null; userId: string }) {
  const { notices, unreadIds } = await getSiteNoticeState(userId, firstName);
  return <NotificationBell notices={notices} unreadIds={unreadIds} />;
}

export async function SiteNav({ remembered }: { remembered?: RememberedHeader }) {
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  const isAdmin = user?.role === "ADMIN";
  const walksHref = isAdmin ? "/admin/walks" : "/walks";
  // user.isOwner is already on the row — no second lookup.
  const permissions = isAdmin && user ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;

  // Signed-in state comes from the server here (not Clerk's client <Show>),
  // so nothing waits for Clerk's browser bundle before appearing.
  const initial = user ? (user.firstName || user.email || "?").charAt(0) : null;
  // Clerk's picture from last time if it was this person's, else their
  // photo on record, else the initial: whatever Clerk's button will show.
  const rememberedAvatar = remembered?.avatar && user && remembered.avatar.clerkId === user.clerkId ? remembered.avatar.url : null;
  const avatarUrl = rememberedAvatar ?? user?.imageUrl ?? null;
  return (
    <>
      <RememberHeader initial={initial} />
      <div className={HEADER_NAV_COLUMN_CLASS} data-nav-ready="">
        {user ? (
          <SiteNavLinks
            isAdmin={isAdmin}
            permissions={permissions}
            progressEnabled={progressEnabled}
            walksHref={walksHref}
          />
        ) : null}
      </div>
      <div className={HEADER_TOOLS_CLASS} data-nav-ready="">
        {user ? (
          <>
            <SiteSearchBar apple={remembered?.apple} />
            <SiteSearchDialog />
            <Suspense fallback={<BellPlaceholder unread={remembered?.unread} />}>
              <SiteNavBell firstName={user.firstName} userId={user.id} />
            </Suspense>
            {/* A fixed slot: while Clerk's code loads the avatar's own
                placeholder can be missing, and the cluster jumped 40px. */}
            <div className="flex size-7 shrink-0 items-center justify-center">
              <ClerkIsland fallback={<AvatarPlaceholder imageUrl={avatarUrl} initial={initial ?? "?"} />}>
                <LazySiteUserButton
                  imageUrl={avatarUrl}
                  initial={initial ?? "?"}
                  progressEnabled={progressEnabled}
                />
              </ClerkIsland>
            </div>
            <EmailPreferencesDrawer
              email={user.email}
              isAdmin={isAdmin}
              preferences={{
                emailAccidentAlerts: user.emailAccidentAlerts,
                emailNewsletter: user.emailNewsletter,
                emailNotices: user.emailNotices,
                emailProgress: user.emailProgress,
                emailWalkAnnouncements: user.emailWalkAnnouncements,
              }}
            />
          </>
        ) : (
          <>
            <Button asChild size="sm" variant="outline">
              <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
            </Button>
            <JoinGroupButton href={accountPortalHref("sign-up", afterAuth)} />
          </>
        )}
      </div>
    </>
  );
}

export async function SiteMobileNav() {
  const [user, theme] = await Promise.all([getOptionalUser(), getSiteTheme()]);
  const facebookUrl = theme.facebookGroupUrl.trim();
  const more: MobileMenuGroup = {
    label: "More",
    items: [
      { href: "/contact", label: "Contact us" },
      { href: "/apps", label: "Walking apps" },
      ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group", newTab: true }] : []),
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-service", label: "Terms of Service" },
    ],
  };

  if (!user) {
    const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
    return (
      <SiteMobileMenu
        groups={[
          { label: "Menu", items: [{ href: "/", label: "Home" }] },
          {
            label: "Account",
            items: [
              { href: accountPortalHref("sign-in", afterAuth), label: "Sign in" },
              { href: accountPortalHref("sign-up", afterAuth), label: "Join the group" },
            ],
          },
          more,
        ]}
      />
    );
  }

  const isAdmin = user.role === "ADMIN";
  const progressEnabled = await getProgressEnabled();
  const permissions = isAdmin ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;
  // Not awaited: the menu renders now and the Notices dot fills in later.
  const noticesUnread = getSiteNoticeState(user.id, user.firstName).then(({ unreadIds }) => unreadIds.length > 0);
  const items = navItems(isAdmin, isAdmin ? "/admin/walks" : "/walks", permissions, progressEnabled).map((item) =>
    item.href === "/notices" ? { ...item, dot: noticesUnread } : item,
  );
  const organiserItems = items.filter((item) => item.href.startsWith("/admin/"));

  return (
    <SiteMobileMenu
      groups={[
        { label: "Menu", items: items.filter((item) => !item.href.startsWith("/admin/")) },
        ...(organiserItems.length ? [{ label: "Manage", items: organiserItems }] : []),
        {
          label: "Account",
          items: [
            ...(isAdmin ? [{ href: "/history", label: "History" }] : []),
            { href: "/email-preferences", label: "Email preferences" },
          ],
        },
        more,
      ]}
    />
  );
}

/**
 * Phone bottom bar: four main pages + More (a sheet with the rest — the
 * ☰ menu's pages, account and site links). Signed-out visitors get Home,
 * Contact, the Facebook group and More; Sign in and Join stay in the header.
 */
export async function SiteBottomNav() {
  const [user, theme] = await Promise.all([getOptionalUser(), getSiteTheme()]);
  // Settings → Site behaviour → Phone menu: "menu" keeps the ☰ menu instead.
  if (theme.mobileNav !== "bottom") return null;
  const facebookUrl = theme.facebookGroupUrl.trim();

  // Signed-out visitors: only the pages they can actually open. Sign in and
  // Join stay as buttons in the header.
  if (!user) {
    return (
      <BottomNavBar
        more={[
          {
            label: "More",
            items: [
              { href: "/apps", label: "Walking apps" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms-of-service", label: "Terms of Service" },
            ],
          },
        ]}
        tabs={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact us" },
          ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group", newTab: true }] : []),
        ]}
      />
    );
  }
  const progressEnabled = await getProgressEnabled();
  const isAdmin = user.role === "ADMIN";
  const permissions = isAdmin ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;
  const noticesUnread = getSiteNoticeState(user.id, user.firstName).then(({ unreadIds }) => unreadIds.length > 0);
  const items = navItems(isAdmin, isAdmin ? "/admin/walks" : "/walks", permissions, progressEnabled).map((item) =>
    item.href === "/notices" ? { ...item, dot: noticesUnread } : item,
  );
  const tabCount = 4;
  const tabs = items.slice(0, tabCount);
  const rest = items.slice(tabCount);
  return (
    <BottomNavBar
      more={[
        { label: "Pages", items: rest },
        {
          label: "Account",
          items: [
            ...(isAdmin && !rest.some((item) => item.href === "/history") ? [{ href: "/history", label: "History" }] : []),
            { href: "/email-preferences", label: "Email preferences" },
          ],
        },
        {
          label: "More",
          items: [
            { href: "/contact", label: "Contact us" },
            { href: "/apps", label: "Walking apps" },
            ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group", newTab: true }] : []),
            { href: "/privacy-policy", label: "Privacy Policy" },
            { href: "/terms-of-service", label: "Terms of Service" },
          ],
        },
      ]}
      tabs={tabs}
    />
  );
}

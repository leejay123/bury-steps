import { Suspense } from "react";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { SiteNavLinks, SiteMobileMenu, type MobileMenuGroup } from "@/components/site-nav-menu";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { getSiteTheme } from "@/lib/site-theme";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { ClerkIsland } from "@/components/clerk-island";
import { JoinGroupButton } from "@/components/join-group-button";
import { navItems } from "@/components/site-nav-items";
import { NotificationBell } from "@/components/notification-bell";
import { SiteSearchBar, SiteSearchDialog } from "@/components/site-search";
import { EmailPreferencesDrawer } from "@/components/email-preferences-drawer";
import { getSiteNoticeState } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";

export function SiteNavFallback() {
  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex" />
      <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end max-md:col-start-3 max-md:min-w-max sm:gap-3">
        <div className="h-8 w-[4.5rem] rounded-md bg-muted" />
        <div className="h-8 w-[7.5rem] rounded-md bg-muted" />
      </div>
    </>
  );
}

// The bell's notices load separately so they never hold up the rest of the
// header (links, search, avatar), which render as soon as the user is known.
async function SiteNavBell({ firstName, userId }: { firstName: string | null; userId: string }) {
  const { notices, unreadIds } = await getSiteNoticeState(userId, firstName);
  return <NotificationBell notices={notices} unreadIds={unreadIds} />;
}

export async function SiteNav() {
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  const isAdmin = user?.role === "ADMIN";
  const walksHref = isAdmin ? "/admin" : "/walks";
  // user.isOwner is already on the row — no second lookup.
  const permissions = isAdmin && user ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;

  // Signed-in state comes from the server here (not Clerk's client <Show>),
  // so nothing waits for Clerk's browser bundle before appearing.
  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex">
        {user ? (
          <SiteNavLinks
            isAdmin={isAdmin}
            permissions={permissions}
            progressEnabled={progressEnabled}
            walksHref={walksHref}
          />
        ) : null}
      </div>
      <div className="flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3">
        {user ? (
          <>
            <SiteSearchBar />
            <SiteSearchDialog />
            <Suspense fallback={<div aria-hidden className="size-8 shrink-0" />}>
              <SiteNavBell firstName={user.firstName} userId={user.id} />
            </Suspense>
            <ClerkIsland>
              <LazySiteUserButton initial={(user.firstName || user.email || "?").charAt(0)} progressEnabled={progressEnabled} />
            </ClerkIsland>
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
      { href: "/contact", label: "Contact Us" },
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
  const items = navItems(isAdmin, isAdmin ? "/admin" : "/walks", permissions, progressEnabled).map((item) =>
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
          { href: "/contact", label: "Contact Us" },
          ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group", newTab: true }] : []),
        ]}
      />
    );
  }
  const progressEnabled = await getProgressEnabled();
  const isAdmin = user.role === "ADMIN";
  const permissions = isAdmin ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;
  const noticesUnread = getSiteNoticeState(user.id, user.firstName).then(({ unreadIds }) => unreadIds.length > 0);
  const items = navItems(isAdmin, isAdmin ? "/admin" : "/walks", permissions, progressEnabled).map((item) =>
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
            { href: "/contact", label: "Contact Us" },
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

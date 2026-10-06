import { Suspense } from "react";
import { cookies } from "next/headers";
import { getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vapidConfig } from "@/lib/vapid";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { navItems } from "@/components/site-nav-items";
import { AVATAR_COOKIE, NAV_COOKIE, parseRememberedNav, type RememberedNavItem } from "@/lib/remembered-nav";
import { RememberHeader } from "@/components/remember-header";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { getSiteTheme } from "@/lib/site-theme";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { ClerkIsland } from "@/components/clerk-island";
import { JoinGroupButton } from "@/components/join-group-button";
import { SiteNavLinks, SiteMobileMenu, StaticNavLinks, type MobileMenuGroup } from "@/components/site-nav-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SiteSearchBar, SiteSearchDialog } from "@/components/site-search";
import { EmailPreferencesDrawer } from "@/components/email-preferences-drawer";
import { getSiteNoticeState } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";

/**
 * The right-hand column is held at the signed-in width (search, bell and
 * avatar: icons on tablets, a search bar from lg) for everyone and in the
 * placeholder too. Its contents change as the header streams in —
 * placeholder, then Sign in/Join or the member's tools — and without a fixed
 * width each change slid the centred menu sideways.
 */
const RIGHT_CLUSTER = "md:min-w-[7.75rem] lg:min-w-[20.5rem]";

/** Cookie read stays inside Suspense so the shared layout can still be prerendered. */
export async function SiteNavSlot() {
  const jar = await cookies();
  const items = parseRememberedNav(jar.get(NAV_COOKIE)?.value);
  const initial = (jar.get(AVATAR_COOKIE)?.value ?? "").slice(0, 1);
  return (
    <Suspense fallback={<SiteNavFallback initial={initial} items={items} />}>
      <SiteNav />
    </Suspense>
  );
}

export function SiteNavFallback({ initial = "", items = [] }: { initial?: string; items?: RememberedNavItem[] }) {
  if (items.length === 0) {
    return (
      <>
        <div className="hidden min-w-0 items-center justify-center md:flex" />
        <div
          className={`flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 ${RIGHT_CLUSTER}`}
        />
      </>
    );
  }
  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex" data-nav-ready="">
        <StaticNavLinks items={items} />
      </div>
      <div
        className={`flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 ${RIGHT_CLUSTER}`}
        data-nav-ready=""
      >
        <SiteSearchBar />
        <span aria-hidden className="inline-flex size-9 shrink-0 rounded-full border border-border bg-background" />
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase"
        >
          {initial}
        </span>
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
  const pushOn = user
    ? (await prisma.pushSubscription.findFirst({ where: { userId: user.id }, select: { id: true } })) != null
    : false;
  const isAdmin = user?.role === "ADMIN";
  const walksHref = isAdmin ? "/admin/walks" : "/walks";
  // user.isOwner is already on the row — no second lookup.
  const permissions = isAdmin && user ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;

  // Signed-in state comes from the server here (not Clerk's client <Show>),
  // so nothing waits for Clerk's browser bundle before appearing.
  const initial = user ? (user.firstName || user.email || "?").charAt(0) : null;
  return (
    <>
      <RememberHeader initial={initial} />
      <div className="hidden min-w-0 items-center justify-center md:flex" data-nav-ready="">
        {user ? (
          <SiteNavLinks
            isAdmin={isAdmin}
            permissions={permissions}
            progressEnabled={progressEnabled}
            walksHref={walksHref}
          />
        ) : null}
      </div>
      <div
        className={`flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 ${RIGHT_CLUSTER}`}
        data-nav-ready=""
      >
        {user ? (
          <>
            <SiteSearchBar />
            <SiteSearchDialog />
            <Suspense fallback={<span aria-hidden className="inline-flex size-9 shrink-0 rounded-full border border-border bg-background" />}>
              <SiteNavBell firstName={user.firstName} userId={user.id} />
            </Suspense>
            {/* A fixed slot: while Clerk's code loads the avatar's own
                placeholder can be missing, and the cluster jumped 40px. */}
            <div className="flex size-7 shrink-0 items-center justify-center">
              <ClerkIsland>
                <LazySiteUserButton initial={initial ?? "?"} progressEnabled={progressEnabled} />
              </ClerkIsland>
            </div>
            <EmailPreferencesDrawer
              email={user.email}
              isAdmin={isAdmin}
              phoneAlertsOn={pushOn}
              preferences={{
                emailAccidentAlerts: user.emailAccidentAlerts,
                emailNewsletter: user.emailNewsletter,
                emailNotices: user.emailNotices,
                emailProgress: user.emailProgress,
                emailWalkAnnouncements: user.emailWalkAnnouncements,
              }}
              vapidPublicKey={vapidConfig()?.publicKey ?? null}
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

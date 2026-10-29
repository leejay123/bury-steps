import Link from "next/link";
import { ChevronsUpDown } from "lucide-react";
import { ClerkIsland } from "@/components/clerk-island";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { getOptionalUser } from "@/lib/auth";
import { getInlineLogo } from "@/lib/inline-logo";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";
import { getProgressEnabled } from "@/lib/progress-settings";
import { getShadcnHomeData } from "./home-data";
import { SidebarNav, type SidebarGroup } from "./sidebar-nav";
import { SignedInMark } from "./signed-in-mark";

const LABEL = "font-medium font-mono text-muted-foreground text-xs uppercase leading-4 tracking-widest";
const PILL =
  "cn-button group/button relative inline-flex select-none items-center justify-center whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:not-aria-[haspopup]:scale-[0.98] cn-button-size-sm cn-button-variant-default transition-none rounded-[calc(var(--radius)*100)] shrink-0";

/**
 * What a member's dashboard sidebar holds, from who they are: their own pages,
 * the organiser pages their permissions open (as the admin pages check), and
 * their settings. Null for someone signed out: they never get the sidebar.
 */
export async function sidebarGroups(): Promise<SidebarGroup[] | null> {
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  if (!user) return null;
  const organiser = user.role === "ADMIN";
  const perms = user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS;
  const groups: SidebarGroup[] = [
    {
      title: "Dashboard",
      links: [
        { href: "/dashboard", label: "Overview", icon: "overview" },
        { href: organiser && perms.permWalksView ? "/admin/walks" : "/walks", label: "Walks", icon: "walks" },
        { href: "/notices", label: "Notices", icon: "notices" },
        ...(progressEnabled ? [{ href: "/progress", label: "Progress", icon: "progress" as const }] : []),
        { href: "/history", label: "History", icon: "history" },
        { href: "/contact", label: "Contact", icon: "contact" },
      ],
    },
  ];
  if (organiser) {
    const links: SidebarGroup["links"] = [];
    if (perms.permMembersView) links.push({ href: "/admin/members", label: "Members", icon: "members" });
    if (perms.permMessages) links.push({ href: "/admin/messages", label: "Messages", icon: "messages" });
    if (perms.permReportsView) links.push({ href: "/admin/reports", label: "Reports", icon: "reports" });
    if (user.isOwner) links.push({ href: "/admin/settings", label: "Settings", icon: "settings" });
    links.push({ href: "/admin/guide", label: "Guide", icon: "guide" });
    groups.push({ title: "Organisers", links });
  }
  groups.push({
    title: "Settings",
    links: [{ href: "/email-preferences", label: "Email preferences", icon: "emails" }],
  });
  return groups;
}

/** The sidebar's own parts (shadcn.io's, class for class), for the frame to place. */
export async function DashSidebarParts({ siteName }: { siteName: string }) {
  const [user, groups, logo, data, progressEnabled] = await Promise.all([
    getOptionalUser(),
    sidebarGroups(),
    getInlineLogo(),
    getShadcnHomeData(),
    getProgressEnabled(),
  ]);
  // Signed out: no sidebar, ever.
  if (!user || !groups) return <SignedInMark signedIn={false} />;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]!;
  const role = user.isOwner ? "Owner" : user.role === "ADMIN" ? "Organiser" : "Member";
  const since = user.createdAt.getFullYear();
  const initial = (user.firstName || user.email || "?").charAt(0);
  const next = data.next;
  return (
    <>
      <SignedInMark signedIn />
      <div className="flex h-14 shrink-0 items-center border-b px-4 lg:hidden">
        <Link
          aria-label={`${siteName}, back to home`}
          className="flex min-w-0 items-center gap-2.5 rounded-md border border-transparent font-bold text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/32 [&_span]:truncate"
          href="/"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-6.5 rounded-full object-contain" src={logo.src} />
          <span>{siteName}</span>
        </Link>
      </div>
      <div className="flex h-14 w-full shrink-0 items-center gap-3 border-b px-4 text-start">
        <span className="relative flex size-8 shrink-0 select-none overflow-hidden rounded-md border bg-background" data-slot="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full object-contain" src={logo.src} />
        </span>
        <span className="grid min-w-0 flex-1 text-start leading-tight">
          <span className="truncate font-medium text-sm">{siteName}</span>
          <span className="truncate text-muted-foreground text-xs">
            {role} · Member since {since}
          </span>
        </span>
      </div>
      <SidebarNav groups={groups} />
      {next ? (
        <div className="bg-muted/60 flex shrink-0 items-center gap-3 border-t px-4 py-3">
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className={LABEL}>Next walk</span>
            <span className="truncate text-muted-foreground text-xs">{next.title}</span>
          </span>
          <Link className={PILL} href={next.href}>
            View
          </Link>
        </div>
      ) : null}
      <div className="flex h-14 shrink-0 items-center gap-3 border-t px-4 text-foreground text-sm">
        <ClerkIsland>
          <LazySiteUserButton image={user.imageUrl} initial={initial} progressEnabled={progressEnabled} />
        </ClerkIsland>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-muted-foreground text-xs">{user.email}</span>
        </span>
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </div>
    </>
  );
}


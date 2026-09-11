/**
 * Granular organiser capabilities — chosen when a member is
 * invited/promoted (see setMemberRole in src/server/actions/members.ts)
 * and editable after from Members (see setOrganiserPermissions). Only
 * meaningful once role is ADMIN; a MEMBER row's columns just sit unused
 * until they're promoted, and a promotion writes these columns
 * immediately — even while the row is still MEMBER pending an invite —
 * so whatever was picked at invite time is already in place the moment
 * they accept.
 *
 * One permission per admin page (Reports and Messages used to be one
 * combined permission, and everything from Homepage down used to be one
 * combined "Settings" permission — split apart so, e.g., someone can
 * manage the newsletter without also being able to reset the site).
 *
 * These are read alongside role (getOptionalUser already selects every
 * column) to decide what the nav shows — see site-nav-items.ts — and are
 * enforced on every admin page and server action itself (requirePermission
 * in src/lib/auth.ts; permissionDenied in src/server/actions/shared.ts), so
 * a limited organiser who already knows a hidden URL is still turned away
 * there.
 *
 * Choosing WHO gets these permissions is itself a separate, narrower
 * capability — promoting/demoting an organiser, editing an existing
 * organiser's permissions, and removing an organiser's account are all
 * restricted to the single site owner (see src/lib/site-owner.ts), not
 * just anyone holding the Members permission here. setMemberRole and
 * setOrganiserPermissions both also refuse to leave an organiser with
 * none of these switched on at all (see hasAnyPermission below) — the
 * whole point of the role is the extra access, so an organiser with
 * nothing granted is never a state either action will produce.
 */
export type OrganiserPermissions = {
  permWalks: boolean;
  permMembers: boolean;
  permMessages: boolean;
  permReports: boolean;
  permHomepage: boolean;
  permNotices: boolean;
  permProgress: boolean;
  permEmails: boolean;
  permSubscribers: boolean;
  permDisplay: boolean;
  permCacheReset: boolean;
};

export const FULL_ORGANISER_PERMISSIONS: OrganiserPermissions = {
  permWalks: true,
  permMembers: true,
  permMessages: true,
  permReports: true,
  permHomepage: true,
  permNotices: true,
  permProgress: true,
  permEmails: true,
  permSubscribers: true,
  permDisplay: true,
  permCacheReset: true,
};

export const NO_ORGANISER_PERMISSIONS: OrganiserPermissions = {
  permWalks: false,
  permMembers: false,
  permMessages: false,
  permReports: false,
  permHomepage: false,
  permNotices: false,
  permProgress: false,
  permEmails: false,
  permSubscribers: false,
  permDisplay: false,
  permCacheReset: false,
};

/** `group` is a UI grouping only (see organiser-permissions-fields.tsx) —
 * every check in this file treats all eleven the same way. */
export const ORGANISER_PERMISSION_OPTIONS: {
  name: keyof OrganiserPermissions;
  label: string;
  hint: string;
  group: "Core" | "Settings & homepage";
}[] = [
  {
    name: "permWalks",
    label: "Walks",
    hint: "Create, edit, and cancel walks; see rosters and health notes.",
    group: "Core",
  },
  {
    name: "permMembers",
    label: "Members",
    hint: "View the member list, and remove a member's account.",
    group: "Core",
  },
  {
    name: "permMessages",
    label: "Messages",
    hint: "Read and manage contact-form messages.",
    group: "Core",
  },
  {
    name: "permReports",
    label: "Accident reports",
    hint: "Record and view accident reports.",
    group: "Core",
  },
  {
    name: "permHomepage",
    label: "Homepage content",
    hint: "Edit hero photos, testimonials, and FAQs.",
    group: "Settings & homepage",
  },
  {
    name: "permNotices",
    label: "Notices",
    hint: "Add, edit, and pin the notices members see in the bell and on Notices.",
    group: "Settings & homepage",
  },
  {
    name: "permProgress",
    label: "Progress goal",
    hint: "Set the optional monthly together clock-in goal.",
    group: "Settings & homepage",
  },
  {
    name: "permEmails",
    label: "Emails",
    hint: "Edit the subject and wording of the emails the site sends.",
    group: "Settings & homepage",
  },
  {
    name: "permSubscribers",
    label: "Subscribers",
    hint: "View newsletter and walk-email subscribers, send campaigns, and export the list.",
    group: "Settings & homepage",
  },
  {
    name: "permDisplay",
    label: "Site display & branding",
    hint: "Site name, logo, colours, homepage copy and section order, cookie notice, and retention settings.",
    group: "Settings & homepage",
  },
  {
    name: "permCacheReset",
    label: "Site cache & reset",
    hint: "Clear the site cache, or reset the whole site back to its defaults.",
    group: "Settings & homepage",
  },
];

export function hasFullAccess(perms: OrganiserPermissions): boolean {
  return ORGANISER_PERMISSION_OPTIONS.every((option) => perms[option.name]);
}

const SETTINGS_GROUP_OPTIONS = ORGANISER_PERMISSION_OPTIONS.filter(
  (option) => option.group === "Settings & homepage",
);

/** True if any of the seven settings-area permissions is granted — used to
 * decide whether the Settings hub (and its nav link) shows at all, since
 * the hub itself isn't tied to any one of the pages it links to. */
export function hasAnySettingsPermission(perms: OrganiserPermissions): boolean {
  return SETTINGS_GROUP_OPTIONS.some((option) => perms[option.name]);
}

/** The whole point of being an organiser is the extra access it grants —
 * an organiser with every permission switched off can't do anything an
 * ordinary member can't, so setMemberRole and setOrganiserPermissions both
 * require this to be true before saving. */
export function hasAnyPermission(perms: OrganiserPermissions): boolean {
  return ORGANISER_PERMISSION_OPTIONS.some((option) => perms[option.name]);
}

/** Same "absent checkbox reads as false" convention as email preferences
 * (see readPreferences in src/server/actions/email-preferences.ts). */
export function readOrganiserPermissions(formData: FormData): OrganiserPermissions {
  const result = {} as OrganiserPermissions;
  for (const option of ORGANISER_PERMISSION_OPTIONS) {
    result[option.name] = formData.get(option.name) === "on";
  }
  return result;
}

/**
 * Where to send a brand-new organiser right after they gain access (e.g.
 * accepting an invite) — always the Walks page, same as the nav's own
 * Walks link (site-nav-items.ts) and the walk-share page's back-link
 * (src/app/w/[token]/page.tsx): the admin dashboard if they were granted
 * Walks, the ordinary member Walks page otherwise. Every admin page now
 * checks its own specific permission (requirePermission), so a fixed
 * "/admin/members" or similar would 404 for an organiser who wasn't
 * granted that one — Walks is the one page every organiser and member
 * alike can always open.
 */
export function walksLandingPath(perms: OrganiserPermissions): string {
  return perms.permWalks ? "/admin" : "/walks";
}

export function pickOrganiserPermissions(user: OrganiserPermissions): OrganiserPermissions {
  const result = {} as OrganiserPermissions;
  for (const option of ORGANISER_PERMISSION_OPTIONS) {
    result[option.name] = user[option.name];
  }
  return result;
}

/**
 * A complete sentence describing what's actually granted — used to fill
 * the `{permissionsList}` placeholder in the organiser-invite email (see
 * sendOrganiserInviteEmail), so the email never overpromises full access
 * for an invite that only switched a couple of things on. Same wording as
 * the invite accept page (src/app/organiser-invite/[token]/page.tsx) for
 * the "nothing granted" case; the granted case is prose instead of that
 * page's bullet list, since this is one paragraph in an email.
 */
export function describeOrganiserPermissions(perms: OrganiserPermissions): string {
  const granted = ORGANISER_PERMISSION_OPTIONS.filter((option) => perms[option.name]);
  if (granted.length === 0) {
    return "No specific organiser tools were switched on for this invite — check with whoever invited you once you've accepted.";
  }
  if (granted.length === ORGANISER_PERMISSION_OPTIONS.length) {
    return "You'll have full access — everything an organiser can do on the site.";
  }
  const clauses = granted.map((option) => {
    const hint = option.hint.replace(/\.$/, "");
    return hint.charAt(0).toLowerCase() + hint.slice(1);
  });
  const joined =
    clauses.length === 1 ? clauses[0] : `${clauses.slice(0, -1).join("; ")}; and ${clauses[clauses.length - 1]}`;
  return `You'll be able to ${joined}.`;
}

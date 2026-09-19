/**
 * Granular organiser capabilities — one shared set applied to every
 * organiser at once (see src/lib/role-permissions.ts), editable by the
 * site owner from Settings → Roles. Organisers are no longer configured
 * individually — there is no more per-person picker at invite time or
 * afterwards.
 *
 * One permission per admin page (Reports split into View/Edit/Create;
 * everything from Homepage down is one permission per settings area).
 * A few sensitive, irreversible actions — deleting a walk, removing a
 * member's account or logging in as one, deleting an accident report —
 * stay owner-only outright and have no column here at all (see
 * PERMISSION_AREA_LABEL / ownerDenied call sites for the list).
 *
 * Read alongside role to decide what the nav shows — see site-nav-items.ts
 * — and enforced on every admin page and server action itself
 * (requirePermission in src/lib/auth.ts; permissionDenied in
 * src/server/actions/shared.ts), so a limited organiser who already knows
 * a hidden URL is still turned away there.
 */
export type OrganiserPermissions = {
  permWalksView: boolean;
  permWalksCreate: boolean;
  permWalksEdit: boolean;
  permWalksCancel: boolean;
  permWalksAttendance: boolean;
  permWalksHealth: boolean;
  permWalksJourney: boolean;
  permWalksExport: boolean;
  permMembersView: boolean;
  permMessages: boolean;
  permReportsView: boolean;
  permReportsEdit: boolean;
  permReportsCreate: boolean;
  permHomepage: boolean;
  permNotices: boolean;
  permProgress: boolean;
  permEmails: boolean;
  permSubscribers: boolean;
  permDisplay: boolean;
  permCacheReset: boolean;
};

export const FULL_ORGANISER_PERMISSIONS: OrganiserPermissions = {
  permWalksView: true,
  permWalksCreate: true,
  permWalksEdit: true,
  permWalksCancel: true,
  permWalksAttendance: true,
  permWalksHealth: true,
  permWalksJourney: true,
  permWalksExport: true,
  permMembersView: true,
  permMessages: true,
  permReportsView: true,
  permReportsEdit: true,
  permReportsCreate: true,
  permHomepage: true,
  permNotices: true,
  permProgress: true,
  permEmails: true,
  permSubscribers: true,
  permDisplay: true,
  permCacheReset: true,
};

/** `group` is a UI grouping only (see the Settings → Roles grid) — every
 * check in this file treats all twenty the same way. */
export const ORGANISER_PERMISSION_OPTIONS: {
  name: keyof OrganiserPermissions;
  label: string;
  hint: string;
  group: "Walks" | "Core" | "Settings & homepage";
}[] = [
  {
    name: "permWalksView",
    label: "View walks",
    hint: "See the walks admin pages — schedule, roster counts, journey log, and cancelled walks.",
    group: "Walks",
  },
  {
    name: "permWalksCreate",
    label: "Create walks",
    hint: "Add new walks to the schedule.",
    group: "Walks",
  },
  {
    name: "permWalksEdit",
    label: "Edit walks",
    hint: "Change an existing walk's time, location, or description.",
    group: "Walks",
  },
  {
    name: "permWalksCancel",
    label: "Cancel or end walks",
    hint: "Cancel a walk before it starts, or end one early.",
    group: "Walks",
  },
  {
    name: "permWalksAttendance",
    label: "Attendance",
    hint: "See who's on a walk, and add or remove someone's clock-in.",
    group: "Walks",
  },
  {
    name: "permWalksHealth",
    label: "Health notes",
    hint: "See health or medical condition notes members have reported.",
    group: "Walks",
  },
  {
    name: "permWalksJourney",
    label: "Journey updates",
    hint: "Post live journey updates while a walk is under way.",
    group: "Walks",
  },
  {
    name: "permWalksExport",
    label: "Retention & export",
    hint: "Lock retention on a cancelled walk, and download the attendee roster (CSV).",
    group: "Walks",
  },
  {
    name: "permMembersView",
    label: "View members",
    hint: "See the member list, walk history, and resend or cancel an invite.",
    group: "Core",
  },
  {
    name: "permMessages",
    label: "Messages",
    hint: "Read and manage contact-form messages.",
    group: "Core",
  },
  {
    name: "permReportsView",
    label: "View accident reports",
    hint: "See the accident report list and print a report.",
    group: "Core",
  },
  {
    name: "permReportsEdit",
    label: "Edit accident reports",
    hint: "Update an existing accident report's details.",
    group: "Core",
  },
  {
    name: "permReportsCreate",
    label: "Create accident reports",
    hint: "Log a new accident report.",
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
 * (src/app/w/[token]/page.tsx): the admin dashboard if the Organiser role
 * currently includes Walks, the ordinary member Walks page otherwise.
 */
export function walksLandingPath(perms: OrganiserPermissions): string {
  return perms.permWalksView || perms.permWalksCreate ? "/admin" : "/walks";
}

/**
 * A complete sentence describing what the Organiser role currently grants —
 * used to fill the `{permissionsList}` placeholder in the organiser-invite
 * email (see sendOrganiserInviteEmail) and shown on the invite-accept page
 * (src/app/organiser-invite/[token]/page.tsx), so an invitee knows upfront
 * what they're accepting.
 */
export function describeOrganiserPermissions(perms: OrganiserPermissions): string {
  const granted = ORGANISER_PERMISSION_OPTIONS.filter((option) => perms[option.name]);
  if (granted.length === 0) {
    return "No organiser tools are currently switched on — check with whoever invited you once you've accepted.";
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

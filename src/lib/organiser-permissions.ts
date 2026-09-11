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
 * These are read alongside role (getOptionalUser already selects every
 * column) to decide what the nav shows — see site-nav-items.ts. They are
 * NOT yet enforced on the admin pages/actions themselves: a limited
 * organiser who already knows a hidden URL can still reach it today.
 * Enforcing each one is the deliberate next step, done gradually rather
 * than as one large change.
 */
export type OrganiserPermissions = {
  permWalks: boolean;
  permMembers: boolean;
  permReportsMessages: boolean;
  permSettings: boolean;
};

export const FULL_ORGANISER_PERMISSIONS: OrganiserPermissions = {
  permWalks: true,
  permMembers: true,
  permReportsMessages: true,
  permSettings: true,
};

export const ORGANISER_PERMISSION_OPTIONS: {
  name: keyof OrganiserPermissions;
  label: string;
  hint: string;
}[] = [
  {
    name: "permWalks",
    label: "Walks",
    hint: "Create, edit, and cancel walks; see rosters and health notes.",
  },
  {
    name: "permMembers",
    label: "Members",
    hint: "View the member list, promote or demote organisers, and remove members.",
  },
  {
    name: "permReportsMessages",
    label: "Reports & messages",
    hint: "Record and view accident reports; read contact-form messages.",
  },
  {
    name: "permSettings",
    label: "Site settings & homepage",
    hint: "Edit homepage content, FAQs, notices, and site-wide settings.",
  },
];

export function hasFullAccess(perms: OrganiserPermissions): boolean {
  return ORGANISER_PERMISSION_OPTIONS.every((option) => perms[option.name]);
}

/** Same "absent checkbox reads as false" convention as email preferences
 * (see readPreferences in src/server/actions/email-preferences.ts). */
export function readOrganiserPermissions(formData: FormData): OrganiserPermissions {
  return {
    permWalks: formData.get("permWalks") === "on",
    permMembers: formData.get("permMembers") === "on",
    permReportsMessages: formData.get("permReportsMessages") === "on",
    permSettings: formData.get("permSettings") === "on",
  };
}

export function pickOrganiserPermissions(user: OrganiserPermissions): OrganiserPermissions {
  return {
    permWalks: user.permWalks,
    permMembers: user.permMembers,
    permReportsMessages: user.permReportsMessages,
    permSettings: user.permSettings,
  };
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
    return "You'll be able to create and edit walks, manage members, and see who's coming on each walk.";
  }
  const clauses = granted.map((option) => {
    const hint = option.hint.replace(/\.$/, "");
    return hint.charAt(0).toLowerCase() + hint.slice(1);
  });
  const joined =
    clauses.length === 1 ? clauses[0] : `${clauses.slice(0, -1).join("; ")}; and ${clauses[clauses.length - 1]}`;
  return `You'll be able to ${joined}.`;
}

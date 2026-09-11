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
 * NOT yet enforced on most admin pages/actions themselves: a limited
 * organiser who already knows a hidden URL can still reach it today.
 * Enforcing each one is the deliberate next step, done gradually rather
 * than as one large change. The one exception is delegation itself —
 * see clampGrantablePermissions — which is enforced now, since without it
 * any organiser with just the Members permission could hand out (to a new
 * account, or anyone else) more access than they hold themselves.
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

export const NO_ORGANISER_PERMISSIONS: OrganiserPermissions = {
  permWalks: false,
  permMembers: false,
  permReportsMessages: false,
  permSettings: false,
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

/**
 * Caps what `actor` may hand to someone else. A full-access actor can
 * grant anything requested; anyone else can only grant a permission they
 * hold themselves — for every other requested field, `fallback` decides
 * what actually gets written instead of the request:
 *
 * - Promoting someone new (setMemberRole): pass NO_ORGANISER_PERMISSIONS —
 *   there's no existing organiser state to preserve, and a MEMBER row's
 *   own permission columns are meaningless leftovers (they default to
 *   true in the database purely so an already-promoted organiser isn't
 *   affected by that default — see the schema comment on User.permWalks).
 *   Trusting them here would let a limited organiser promote a fresh
 *   account straight to full access by simply never asking for less.
 * - Editing an existing organiser (setOrganiserPermissions): pass that
 *   row's current permissions — a limited actor can't touch a permission
 *   outside their own remit, in either direction, but a legitimately
 *   granted one stays as it was rather than being silently stripped.
 *
 * This is what actually stops the escalation a permissions system like
 * this invites: without it, holding just the Members permission would be
 * enough to hand any account — including a fresh one the organiser
 * controls — full access, regardless of what they were given themselves.
 */
export function clampGrantablePermissions(
  actor: OrganiserPermissions,
  requested: OrganiserPermissions,
  fallback: OrganiserPermissions,
): OrganiserPermissions {
  if (hasFullAccess(actor)) return requested;
  const result = { ...fallback };
  for (const option of ORGANISER_PERMISSION_OPTIONS) {
    if (actor[option.name]) result[option.name] = requested[option.name];
  }
  return result;
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

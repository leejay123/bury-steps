/**
 * What each menu link's drop-down holds in the shadcn.io header (laid out
 * like shadcn.io's: a first group of large links, then smaller groups).
 * Links to pages a visitor can't open just send them to sign in, as the
 * site's own menu does.
 */
export type NavGroup = { title: string; elevated?: boolean; links: { href: string; label: string }[] };
export type NavSection = { id: string; href: string; label: string; groups: NavGroup[] };

const HELP: NavGroup = {
  title: "Help",
  links: [
    { href: "/#faq", label: "Questions people ask" },
    { href: "/#home-how-heading", label: "How it works" },
    { href: "/#home-rules-heading", label: "Group rules" },
    { href: "/contact", label: "Contact us" },
  ],
};

const GROUPS: Record<string, NavGroup[]> = {
  "/": [
    {
      title: "Explore Bury Steps",
      elevated: true,
      links: [
        { href: "/", label: "Home" },
        { href: "/#home-walks-heading", label: "Walks coming up" },
        { href: "/#home-how-heading", label: "How it works" },
        { href: "/#home-rules-heading", label: "Group rules" },
        { href: "/#faq", label: "Questions" },
      ],
    },
    {
      title: "The group",
      links: [
        { href: "/#home-expect-heading", label: "What to expect" },
        { href: "/#home-goals-heading", label: "Why people walk" },
        { href: "/#home-essentials-heading", label: "Walk essentials" },
        { href: "/#home-reviews-heading", label: "What members say" },
      ],
    },
    { title: "More", links: [{ href: "/contact", label: "Contact us" }, { href: "/apps", label: "Walking apps" }] },
  ],
  "/walks": [
    {
      title: "Explore Walks",
      elevated: true,
      links: [
        { href: "/walks", label: "All walks" },
        { href: "/history", label: "Your history" },
        { href: "/progress", label: "Group progress" },
      ],
    },
    {
      title: "On the day",
      links: [
        { href: "/#faq", label: "What to bring" },
        { href: "/#faq", label: "How clock-in works" },
        { href: "/#home-essentials-heading", label: "Walk essentials" },
        { href: "/#home-rules-heading", label: "Group rules" },
      ],
    },
    { title: "More", links: [{ href: "/apps", label: "Walking apps" }, { href: "/contact", label: "Ask a question" }] },
  ],
  "/notices": [
    {
      title: "Explore Notices",
      elevated: true,
      links: [
        { href: "/notices", label: "All notices" },
        { href: "/email-preferences", label: "Email preferences" },
      ],
    },
    HELP,
  ],
  "/progress": [
    {
      title: "Explore Progress",
      elevated: true,
      links: [
        { href: "/progress", label: "Group progress" },
        { href: "/history", label: "Your history" },
        { href: "/dashboard", label: "Dashboard" },
      ],
    },
    HELP,
  ],
  "/history": [
    {
      title: "Your walking",
      elevated: true,
      links: [
        { href: "/history", label: "Your history" },
        { href: "/progress", label: "Group progress" },
        { href: "/dashboard", label: "Dashboard" },
      ],
    },
    HELP,
  ],
  "/contact": [
    {
      title: "Get in touch",
      elevated: true,
      links: [
        { href: "/contact", label: "Contact us" },
        { href: "/#faq", label: "Questions" },
      ],
    },
    { title: "More", links: [{ href: "/apps", label: "Walking apps" }, { href: "/walks", label: "See the walks" }] },
  ],
  "/apps": [
    {
      title: "Walking apps",
      elevated: true,
      links: [
        { href: "/apps", label: "Apps we like" },
        { href: "/walks", label: "See the walks" },
      ],
    },
    HELP,
  ],
};

const ORGANISER: NavGroup[] = [
  {
    title: "Organisers",
    elevated: true,
    links: [
      { href: "/admin/walks", label: "Walks" },
      { href: "/admin/members", label: "Members" },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/reports", label: "Reports" },
    ],
  },
  {
    title: "Set up",
    links: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/guide", label: "Guide" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

/** A menu link with its drop-down (organiser pages share one). */
export function navSection(link: { href: string; label: string }): NavSection {
  const groups =
    link.href === "/admin/walks"
      ? GROUPS["/walks"]!.map((group, i) =>
          i === 0 ? { ...group, links: [{ href: "/admin/walks", label: "All walks" }, ...group.links.slice(1)] } : group,
        )
      : (GROUPS[link.href] ?? (link.href.startsWith("/admin") ? ORGANISER : []));
  const id = link.href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
  return { id, href: link.href, label: link.label, groups };
}

const HOW: NavGroup[] = [
  {
    title: "Getting started",
    elevated: true,
    links: [
      { href: "/#home-how-heading", label: "How it works" },
      { href: "/#home-expect-heading", label: "What to expect" },
      { href: "/#home-rules-heading", label: "Group rules" },
      { href: "/#home-essentials-heading", label: "Walk essentials" },
    ],
  },
  {
    title: "The group",
    links: [
      { href: "/#home-about-heading", label: "How this started" },
      { href: "/#home-goals-heading", label: "Why people walk" },
      { href: "/#home-reviews-heading", label: "What members say" },
    ],
  },
];

/** Each organiser page leads its own drop-down; the rest of the organiser pages follow. */
function organiserSection(id: string, href: string, label: string, links: { href: string; label: string }[]): NavSection {
  const rest = links.filter((link) => link.href !== href);
  return {
    id,
    href,
    label,
    groups: [
      { title: `Explore ${label}`, elevated: true, links: [{ href, label: `All ${label.toLowerCase()}` }, ...rest.slice(0, 3)] },
      {
        title: "Set up",
        links: [
          ...rest.slice(3),
          { href: "/admin/walks", label: "Manage walks" },
          { href: "/dashboard", label: "Dashboard" },
        ],
      },
    ],
  };
}

/**
 * The header's menu, laid out like shadcn.io's (a row of links, each a
 * drop-down), built from the pages this person can open (their remembered
 * menu, or a visitor's). Visitors: About, Walks, How it works, Questions,
 * Apps, Contact. Members: Walks, Notices, Progress, History, Apps, Contact,
 * Help. Organisers swap Apps and Contact (kept in Help) for Members,
 * Messages, Reports and Settings.
 */
/** Home, first in every menu: straight back to the homepage. */
const HOME: NavSection = { id: "home", href: "/", label: "Home", groups: [] };

/**
 * The signed-in menu, the same for every member and organiser (organisers'
 * own pages are in the dashboard sidebar), so it can be built into the
 * ready-made page and shown from the first paint (globalnav.tsx).
 */
export function memberMenu(progressEnabled: boolean, facebookUrl: string): NavSection[] {
  const links = [
    { href: "/walks", label: "Walks" },
    { href: "/notices", label: "Notices" },
    ...(progressEnabled ? [{ href: "/progress", label: "Progress" }] : []),
    { href: "/history", label: "History" },
  ];
  return shortMenu(links, facebookUrl).map((section) => ({ ...section, id: `m-${section.id}` }));
}

export function shortMenu(links: { href: string; label: string }[], facebookUrl: string): NavSection[] {
  const has = (href: string) => links.some((link) => link.href === href);
  const walksHref = has("/admin/walks") ? "/admin/walks" : "/walks";
  const signedIn = has("/notices") || has("/history");
  const walks: NavSection = { ...navSection({ href: walksHref, label: "Walks" }), id: "walks" };
  const apps: NavSection = { ...navSection({ href: "/apps", label: "Apps" }), id: "apps" };
  const contact: NavSection = { ...navSection({ href: "/contact", label: "Contact" }), id: "contact" };
  const help: NavSection = {
    id: "help",
    href: "/contact",
    label: "Help",
    groups: [
      {
        title: "Get help",
        elevated: true,
        links: [
          { href: "/#faq", label: "Questions" },
          { href: "/contact", label: "Contact us" },
          ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group" }] : []),
        ],
      },
      ...HOW.slice(0, 1).map((group) => ({ ...group, elevated: false, title: "About the group" })),
      { title: "More", links: [{ href: "/apps", label: "Walking apps" }, { href: "/email-preferences", label: "Email preferences" }] },
    ],
  };

  if (!signedIn) {
    return [
      HOME,
      { ...navSection({ href: "/", label: "About" }), id: "about", href: "/#home-about-heading" },
      walks,
      { id: "how", href: "/#home-how-heading", label: "How it works", groups: HOW },
      { ...help, id: "questions", href: "/#faq", label: "Questions" },
      apps,
      contact,
    ];
  }

  const sections: NavSection[] = [HOME, walks];
  if (has("/notices")) sections.push({ ...navSection({ href: "/notices", label: "Notices" }), id: "notices" });
  if (has("/progress")) sections.push({ ...navSection({ href: "/progress", label: "Progress" }), id: "progress" });
  if (has("/history")) sections.push({ ...navSection({ href: "/history", label: "History" }), id: "history" });
  const manage = [
    { href: "/admin/members", label: "Members" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/guide", label: "Guide" },
  ].filter((link) => has(link.href));
  if (manage.length) {
    for (const link of manage.filter((link) => link.href !== "/admin/guide"))
      sections.push(organiserSection(link.href.split("/").pop()!, link.href, link.label, manage));
  } else {
    sections.push(apps, contact);
  }
  sections.push(help);
  return sections;
}

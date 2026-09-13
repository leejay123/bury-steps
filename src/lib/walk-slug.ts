// Pure, client-safe string helpers only — no `prisma` import here. This
// module is imported by client components (recent-walks-carousel,
// upcoming-walk-cards, …) just for walkSharePath; pulling in `@/lib/db`
// alongside it used to drag @prisma/client's browser stub (~110KB of
// runtime error stubs that can never work in a browser) into those pages'
// first-load JS. The DB-touching slug allocators live in
// walk-slug-server.ts instead — see that file for why.
const TITLE_SLUG_MAX = 48;
const NAME_WORD_MAX = 12;
const SKIP_WORDS = new Set(["the", "a", "an", "and", "of", "at", "to", "from"]);

/** Lowercase hyphenated title, letters and digits only. */
export function slugifyWalkTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TITLE_SLUG_MAX)
    .replace(/-+$/g, "");
}

function shortWalkName(title: string): string {
  const word = slugifyWalkTitle(title)
    .split("-")
    .find((part) => part.length >= 2 && !/^\d+$/.test(part) && !SKIP_WORDS.has(part));
  return word ? word.slice(0, NAME_WORD_MAX) : "";
}

/** Short share slug base: “burrs”. First place word only — no date. */
export function walkSlugBase(title: string): string {
  return shortWalkName(title) || "walk";
}

export function walkSharePath(walk: { slug?: string | null; token: string }): string {
  return `/w/${walk.slug || walk.token}`;
}

export function walkShareUrl(
  origin: string,
  walk: { slug?: string | null; token: string },
): string {
  return `${origin}${walkSharePath(walk)}`;
}

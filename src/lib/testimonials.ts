export const MAX_HOMEPAGE_TESTIMONIALS = 12;
export const MAX_TESTIMONIALS_SECTION_TITLE = 80;
export const MAX_TESTIMONIALS_SECTION_INTRO = 280;

export const DEFAULT_TESTIMONIALS_SECTION_TITLE = "From the group";
export const DEFAULT_TESTIMONIALS_SECTION_INTRO =
  "A few words from people who walk with us on Sundays.";

export function parseTestimonialsSectionTitle(raw: string): string | "invalid" {
  const title = raw.trim().replace(/\s+/g, " ");
  if (title.length < 2 || title.length > MAX_TESTIMONIALS_SECTION_TITLE) return "invalid";
  return title;
}

export function parseTestimonialsSectionIntro(raw: string): string | "invalid" {
  const intro = raw.trim().replace(/\s+/g, " ");
  if (intro.length < 8 || intro.length > MAX_TESTIMONIALS_SECTION_INTRO) return "invalid";
  return intro;
}

export type TestimonialView = {
  id: string;
  sortOrder: number;
  name: string;
  role: string;
  quote: string;
  image?: string;
};

export function testimonialSrc(row: {
  id: string;
  imagePath: string | null;
  imageMime: string | null;
  updatedAt: Date;
}): string | undefined {
  if (row.imagePath) return row.imagePath;
  if (row.imageMime) return `/api/testimonials/${row.id}?v=${row.updatedAt.getTime()}`;
  return undefined;
}

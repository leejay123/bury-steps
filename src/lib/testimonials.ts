export const MAX_HOMEPAGE_TESTIMONIALS = 12;

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

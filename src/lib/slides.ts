export const MAX_HOMEPAGE_SLIDES = 3;
export const DEFAULT_HERO_PATH = "/slides/bury-steps-hero.jpg";

export type SlideView = {
  id: string;
  sortOrder: number;
  alt: string;
  src: string;
};

export function slideSrc(slide: {
  id: string;
  imagePath: string | null;
  updatedAt: Date;
}): string {
  if (slide.imagePath) return slide.imagePath;
  return `/api/slides/${slide.id}?v=${slide.updatedAt.getTime()}`;
}

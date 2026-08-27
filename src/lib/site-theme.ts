import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { SITE_SETTING_ID } from "@/lib/theme";

export type SiteTheme = {
  carouselEnabled: boolean;
  scrollToTopEnabled: boolean;
};

function defaultTheme(): SiteTheme {
  return {
    carouselEnabled: true,
    scrollToTopEnabled: true,
  };
}

async function loadSiteTheme(): Promise<SiteTheme> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { carouselEnabled: true, scrollToTopEnabled: true },
  });
  return {
    carouselEnabled: row?.carouselEnabled ?? true,
    scrollToTopEnabled: row?.scrollToTopEnabled ?? true,
  };
}

const getCachedSiteTheme = unstable_cache(loadSiteTheme, ["site-theme", "v2"], {
  tags: [HOMEPAGE_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export const getSiteTheme = cache(async (): Promise<SiteTheme> => {
  try {
    return await getCachedSiteTheme();
  } catch {
    return defaultTheme();
  }
});

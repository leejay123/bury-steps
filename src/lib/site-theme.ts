import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import {
  DEFAULT_PRIMARY_COLOR,
  SITE_SETTING_ID,
  normalizeHex,
  themeStyle,
} from "@/lib/theme";

type SiteTheme = {
  primaryColor: string;
  style: CSSProperties;
  carouselEnabled: boolean;
};

function defaultTheme(): SiteTheme {
  return {
    primaryColor: DEFAULT_PRIMARY_COLOR,
    style: themeStyle(DEFAULT_PRIMARY_COLOR),
    carouselEnabled: true,
  };
}

async function loadSiteTheme(): Promise<SiteTheme> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { primaryColor: true, carouselEnabled: true },
  });
  const primaryColor = normalizeHex(row?.primaryColor ?? "") ?? DEFAULT_PRIMARY_COLOR;
  return {
    primaryColor,
    style: themeStyle(primaryColor),
    carouselEnabled: row?.carouselEnabled ?? true,
  };
}

const getCachedSiteTheme = unstable_cache(loadSiteTheme, ["site-theme"], {
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

import { cache } from "react";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_PRIMARY_COLOR,
  SITE_SETTING_ID,
  normalizeHex,
  themeStyle,
} from "@/lib/theme";

export const getSiteTheme = cache(async (): Promise<{
  primaryColor: string;
  style: CSSProperties;
  carouselEnabled: boolean;
}> => {
  try {
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
  } catch {
    return {
      primaryColor: DEFAULT_PRIMARY_COLOR,
      style: themeStyle(DEFAULT_PRIMARY_COLOR),
      carouselEnabled: true,
    };
  }
});

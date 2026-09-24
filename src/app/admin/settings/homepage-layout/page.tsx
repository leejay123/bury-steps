import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { CarouselToggle } from "./carousel-toggle";
import { MemberNoticesToggle } from "./member-notices-toggle";

export const dynamic = "force-dynamic";

export default async function HomepageLayoutSettingsPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The site name and tagline always stay at the top. Choose the order of the sections below them, and whether the photos and latest notices show."
      previewHref="/"
      title="Homepage layout"
    >
      <HomepageSectionsSettings sectionOrder={theme.homepageSectionOrder} />
      <SettingsSectionGroup title="Show or hide">
        <CarouselToggle enabled={theme.carouselEnabled} />
        <MemberNoticesToggle enabled={theme.memberNoticesEnabled} />
      </SettingsSectionGroup>
    </SettingsPage>
  );
}

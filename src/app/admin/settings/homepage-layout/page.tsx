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
      description="The hero (site name and tagline) always stays at the top. Reorder the blocks below it and choose whether the photo carousel shows."
      previewHref="/"
      title="Homepage layout"
    >
      <SettingsSectionGroup
        description="The hero (site name and tagline) always stays at the top. Reorder the blocks below it and choose whether the photo carousel shows."
        title="Layout"
      >
        <HomepageSectionsSettings sectionOrder={theme.homepageSectionOrder} />
        <CarouselToggle enabled={theme.carouselEnabled} />
        <MemberNoticesToggle enabled={theme.memberNoticesEnabled} />
      </SettingsSectionGroup>
    </SettingsPage>
  );
}

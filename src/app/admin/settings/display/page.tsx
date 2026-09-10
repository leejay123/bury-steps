import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { getAllWalksTabEnabled } from "@/lib/walk-progress";
import { SITE_SETTING_ID } from "@/lib/theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { AboutListsSettings } from "./about-lists-settings";
import { AllWalksTabToggle } from "./all-walks-tab-toggle";
import { CarouselToggle } from "../hero-photos/carousel-toggle";
import { ContactMessagesOwnerSettings } from "./contact-messages-owner-settings";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { OrganiserInviteToggle } from "./organiser-invite-toggle";
import { DisplaySettings } from "./display-form";
import { DisplaySettingsLayout } from "./display-settings-layout";
import { FacebookGroupSettings } from "./facebook-group-settings";
import { FaqSectionCopySettings } from "./faq-section-copy-settings";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { HowThisStartedCopySettings } from "./how-this-started-copy-settings";
import { SiteBrandingSettings } from "./site-branding-settings";
import { ReportBannerSettings } from "./report-banner-settings";
import { SiteFaviconSettings } from "./site-favicon-settings";
import { SiteLogoSettings } from "./site-logo-settings";
import { TestimonialsSectionCopySettings } from "./testimonials-section-copy-settings";

export const dynamic = "force-dynamic";

export default async function DisplaySettingsPage() {
  await requireAdmin();
  const [theme, allWalksTabEnabled, organisers, contactSetting] = await Promise.all([
    getSiteTheme(),
    getAllWalksTabEnabled(),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { contactMessagesOwnerId: true, organiserInviteRequired: true },
    }),
  ]);

  return (
    <SettingsPage
      description="Name, tagline, Facebook link, homepage copy and section order, cookie notice, and back to top."
      previewHref="/"
      title="Display"
    >
      <DisplaySettingsLayout>
        <SettingsSectionGroup
          description="How the site introduces itself in the hero, tabs, and share previews."
          id="identity"
          title="Identity"
        >
          <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
          <SiteLogoSettings hasCustomLogo={theme.hasCustomLogo} logoSrc={theme.logoSrc} />
          <SiteFaviconSettings
            faviconSrc={theme.faviconSrc}
            hasCustomFavicon={theme.hasCustomFavicon}
          />
          <ReportBannerSettings reportBannerSrc={theme.reportBannerSrc} />
          <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="The hero (site name and tagline) always stays at the top. Reorder the blocks below it and choose whether the photo carousel shows."
          id="homepage-layout"
          title="Layout"
        >
          <HomepageSectionsSettings sectionOrder={theme.homepageSectionOrder} />
          <CarouselToggle enabled={theme.carouselEnabled} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="What members can see about walks beyond their own history."
          id="member-walks"
          title="Member walks"
        >
          <AllWalksTabToggle enabled={allWalksTabEnabled} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="Who's responsible for the public contact form."
          id="contact-messages"
          title="Contact messages"
        >
          <ContactMessagesOwnerSettings
            currentOwnerId={contactSetting?.contactMessagesOwnerId ?? null}
            organisers={organisers.map((organiser) => ({ id: organiser.id, name: displayName(organiser) }))}
          />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="How promoting a member to organiser takes effect."
          id="organisers"
          title="Organisers"
        >
          <OrganiserInviteToggle enabled={contactSetting?.organiserInviteRequired ?? false} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="Headings and body copy for homepage sections. Quotes and questions are managed under Settings."
          id="homepage-copy"
          title="Homepage copy"
        >
          <HowThisStartedCopySettings
            howThisStartedBody={theme.howThisStartedBody}
            howThisStartedEyebrow={theme.howThisStartedEyebrow}
            howThisStartedTeaser={theme.howThisStartedTeaser}
            howThisStartedTitle={theme.howThisStartedTitle}
          />
          <AboutListsSettings
            aboutExpectHeading={theme.aboutExpectHeading}
            aboutExpectText={theme.aboutExpectText}
            aboutGoalsHeading={theme.aboutGoalsHeading}
            aboutGoalsText={theme.aboutGoalsText}
            aboutPlacesHeading={theme.aboutPlacesHeading}
            aboutPlacesText={theme.aboutPlacesText}
            aboutRulesHeading={theme.aboutRulesHeading}
            aboutRulesText={theme.aboutRulesText}
          />
          <TestimonialsSectionCopySettings
            testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
            testimonialsSectionIntro={theme.testimonialsSectionIntro}
            testimonialsSectionTitle={theme.testimonialsSectionTitle}
          />
          <FaqSectionCopySettings
            faqSectionIntro={theme.faqSectionIntro}
            faqSectionTitle={theme.faqSectionTitle}
          />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="Sitewide behaviour that is not part of the homepage story."
          id="site-chrome"
          title="Site chrome"
        >
          <CookieConsentSettings variant={theme.cookieConsentVariant} />
          <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
        </SettingsSectionGroup>
      </DisplaySettingsLayout>
    </SettingsPage>
  );
}

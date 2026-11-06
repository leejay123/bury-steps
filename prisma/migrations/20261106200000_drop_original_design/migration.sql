-- The original site design, photo slider, hero styles and section patterns
-- are gone. The public site is always the shadcn.io look.

DROP TABLE IF EXISTS "HomepageSlide";

ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "carouselEnabled";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "siteDesign";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "sliderHeroWords";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "homeFramed";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "titleRevealEnabled";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "homepageSectionOrder";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "memberNoticesEnabled";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "heroStyle";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "heroVideoKey";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "heroOverlayOpacity";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "heroTextColor";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "heroBgPattern";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "howThisStartedBgPattern";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "testimonialsBgPattern";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "memberNoticesBgPattern";
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "faqsBgPattern";

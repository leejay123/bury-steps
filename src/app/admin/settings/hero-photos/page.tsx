import { requireAdmin } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsBackLink } from "../settings-back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HeroPhotosSettingsPage() {
  await requireAdmin();
  const slides = await getHomepageSlides();

  return (
    <div className="flex flex-col gap-4">
      <SettingsBackLink />
      <Card>
        <CardHeader>
          <CardTitle>Hero photos</CardTitle>
          <CardDescription>
            The carousel at the top of the public homepage. You can keep up to {MAX_HOMEPAGE_SLIDES}{" "}
            slides, change each picture, and move them into the order visitors will see. With two or
            more slides, the photos rotate automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />
        </CardContent>
      </Card>
    </div>
  );
}

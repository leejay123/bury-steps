import { HomeAboutDialog } from "@/components/home-about-dialog";
import { FeatureSection } from "@/components/feature-section";

export function HomeWelcome() {
  return (
    <>
      <FeatureSection />
      <div className="flex justify-center px-4 py-10">
        <HomeAboutDialog />
      </div>
    </>
  );
}

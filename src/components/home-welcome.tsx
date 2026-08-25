import { HomeAboutDialog } from "@/components/home-about-dialog";
import { FeatureSection } from "@/components/feature-section";

export function HomeWelcome() {
  return (
    <>
      <FeatureSection />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold tracking-tight">How this started</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Just eight weeks ago, in June, I could not find the motivation to walk alone. Within hours
          of taking that first step I started this group, with no idea what it would become. It is
          now a Sunday community built on kindness, friendship and a warm welcome — whether you are
          new to walking or simply want good company outdoors.
        </p>
        <HomeAboutDialog />
      </div>
    </>
  );
}

import { HomeAboutDialog } from "@/components/home-about-dialog";
import { FeatureSection } from "@/components/feature-section";

export function HomeWelcome() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
          Support · Together · Empathy · Pace · Steps
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Bury Steps Walking Group</h1>
        <p className="text-muted-foreground">
          Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just
          people walking together.
        </p>
      </div>

      <FeatureSection />

      <HomeAboutDialog />
    </div>
  );
}

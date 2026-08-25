import { ArrowRightIcon } from "lucide-react";
import { HomeAboutDialog } from "@/components/home-about-dialog";
import { FeatureSection } from "@/components/feature-section";
import { HeroCopy } from "@/components/hero";
import { Button } from "@/components/ui/button";

export function HomeWelcome() {
  return (
    <>
      <FeatureSection />
      <section>
        <HeroCopy
          actions={
            <HomeAboutDialog
              trigger={
                <Button>
                  Read more
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              }
            />
          }
          title="How this started"
          titleAs="h2"
        >
          <p>
            Just eight weeks ago, in June, I could not find the motivation to walk alone. Within
            hours of taking that first step I started this group, with no idea what it would become.
          </p>
        </HeroCopy>
      </section>
    </>
  );
}

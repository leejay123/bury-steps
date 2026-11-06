import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getSiteTheme } from "@/lib/site-theme";
import { ShadcnContactForm } from "./contact-form";
import { BUTTON_OUTLINE, Guides } from "@/components/shadcnio/parts";
import { PageKindMark } from "@/components/shadcnio/page-kind";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";

export const metadata: Metadata = {
  title: "Contact us",
};

export default async function ContactPage() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <DesignedSitePage page="contact">
      <div className="flex flex-1 flex-col" data-shadcn-page="">
        <PageKindMark kind="plain" />
        <section aria-labelledby="contact-heading" className="border-t first-of-type:border-t-0">
          <div className="relative">
            <Guides at="bottom" />
            <div className="px-5 md:px-12 flex flex-col gap-5 pb-8 md:flex-row md:items-end md:justify-between md:gap-8 md:pb-10 pt-8 md:pt-10">
              <div className="flex flex-col max-w-2xl gap-3 lg:gap-4">
                <p className="font-medium font-mono text-muted-foreground text-xs uppercase leading-4 tracking-widest">Help</p>
                <h1 className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id="contact-heading">
                  <span className="whitespace-nowrap">
                    <span
                      aria-hidden="true"
                      className="me-[0.18em] size-[0.82em] -translate-y-[0.05em] border border-foreground/[0.12] align-middle inline-flex items-center justify-center rounded-[0.24em] bg-background [&_svg]:size-[0.5em] [&_svg]:stroke-[1.5]"
                    >
                      <Mail />
                    </span>
                    Contact
                  </span>{" "}
                  us
                </h1>
                <p className="text-pretty text-muted-foreground md:text-lg">
                  <span className="font-medium text-foreground">An organiser reads every message</span> and gets back to
                  you: joining, a walk, or anything else.
                </p>
              </div>
              {facebookUrl ? (
                <div className="flex shrink-0 gap-2">
                  <a className={BUTTON_OUTLINE} href={facebookUrl} rel="noopener noreferrer" target="_blank">
                    Ask on Facebook
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          <ShadcnContactForm
            steps={[
              "Tell us who you are, so we know who to reply to.",
              "Ask anything: joining, a walk, or something else.",
              "An organiser reads it and gets back to you, usually within a few days.",
            ]}
          />
        </section>
      </div>
    </DesignedSitePage>
  );
}

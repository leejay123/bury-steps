import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

// Preview-only test hero (see src/app/page.tsx) — a dark, video-backed
// alternative to the usual light HeroSection. Scoped font instances so this
// doesn't change typography anywhere else on the site.
const heroSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["italic", "normal"],
  variable: "--font-hero-serif",
});
const heroSans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-hero-sans",
});

export function HeroCinematic({
  signInHref,
  signUpHref,
  siteName,
  siteTagline,
}: {
  signInHref: string;
  signUpHref: string;
  siteName: string;
  siteTagline: string;
}) {
  return (
    <section
      className={`${heroSerif.variable} ${heroSans.variable} relative isolate flex min-h-[85svh] items-center overflow-hidden bg-[#0a0a0c] text-slate-50`}
      style={{ fontFamily: "var(--font-hero-sans)" }}
    >
      <video
        autoPlay
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        loop
        muted
        playsInline
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, transparent 20%, rgba(10,10,12,0.55) 60%, #0a0a0c 100%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-24 md:px-6">
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#ffb7c5]">
            Support · Together · Empathy · Pace · Steps
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1
            className="text-[clamp(2.75rem,8vw,5.5rem)] font-bold italic leading-[0.95] drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "var(--font-hero-serif)" }}
          >
            {siteName}
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="max-w-xl text-lg font-light leading-relaxed text-white/70 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
            {siteTagline}
          </p>
        </FadeIn>
        <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-center" delay={0.3}>
          <Show when="signed-in">
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link href="/walks">
                Your walks
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </Show>
          <Show when="signed-out">
            <Button asChild className="w-full sm:w-auto" size="lg">
              <a href={signUpHref}>
                Join the group
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button
              asChild
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
              size="lg"
              variant="outline"
            >
              <a href={signInHref}>Sign in</a>
            </Button>
          </Show>
        </FadeIn>
      </div>
    </section>
  );
}

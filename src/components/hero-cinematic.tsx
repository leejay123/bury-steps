import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

// Optional alternative to the usual light HeroSection — a dark, video-backed
// hero, picked in Settings → Homepage layout → Hero style. Scoped font
// instances so this doesn't change typography anywhere else on the site.
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
  videoSrc,
}: {
  signInHref: string;
  signUpHref: string;
  siteName: string;
  siteTagline: string;
  videoSrc: string;
}) {
  return (
    <section
      className={`${heroSerif.variable} ${heroSans.variable} relative isolate flex min-h-[50svh] items-center justify-center overflow-hidden bg-[#0a0a0c] text-center text-slate-50`}
      style={{ fontFamily: "var(--font-hero-sans)" }}
    >
      <video
        autoPlay
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        key={videoSrc}
        loop
        muted
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, transparent 20%, rgba(10,10,12,0.55) 60%, #0a0a0c 100%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-14 md:px-6">
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#ffb7c5]">
            Support · Together · Empathy · Pace · Steps
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1
            className="text-[clamp(2.25rem,6vw,4rem)] font-bold italic leading-[0.95] drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]"
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
        <FadeIn className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center" delay={0.3}>
          <Show when="signed-in">
            <Button asChild>
              <Link href="/walks">Your walks</Link>
            </Button>
          </Show>
          <Show when="signed-out">
            <Button asChild>
              <a href={signUpHref}>
                Join the group
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={signInHref}>Sign in</a>
            </Button>
          </Show>
        </FadeIn>
      </div>
    </section>
  );
}

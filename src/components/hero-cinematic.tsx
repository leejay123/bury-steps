import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

// Optional alternative to the usual light HeroSection — a dark, video-backed
// hero, picked in Settings → Homepage layout → Hero style. Title uses the
// site's own default heading font (no custom serif) so it matches every
// other page's title.
const heroWhiteButtonClassName = "bg-white text-black hover:bg-white/90";

export function HeroCinematic({
  overlayOpacity,
  signInHref,
  signUpHref,
  siteName,
  siteTagline,
  textColor,
  videoSrc,
}: {
  /** 0-100 — darkness of the gradient over the video. */
  overlayOpacity: number;
  signInHref: string;
  signUpHref: string;
  siteName: string;
  siteTagline: string;
  /** Hex color for the eyebrow/title/tagline text. */
  textColor: string;
  videoSrc: string;
}) {
  return (
    <section className="relative isolate flex min-h-[50svh] items-center justify-center overflow-hidden bg-[#0a0a0c] text-center">
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
          // Flat, not a radial gradient — a vignette shape (circle or
          // ellipse) always darkens unevenly by design, which fights an
          // "overlay darkness" slider meant to control one uniform amount.
          // A plain wash darkens the whole video by exactly the slider's
          // percentage everywhere, with no shape artifacts to fight.
          backgroundColor: `rgba(10,10,12,${overlayOpacity / 100})`,
        }}
      />

      <div
        className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-14 md:px-6"
        style={{ color: textColor }}
      >
        <FadeIn>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] opacity-80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] sm:text-xs sm:tracking-[0.35em]">
            Support · Together · Empathy · Pace · Steps
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-[1.05] drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            {siteName}
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="max-w-xl text-sm font-light leading-relaxed opacity-70 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)] sm:text-lg">
            {siteTagline}
          </p>
        </FadeIn>
        <FadeIn className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center" delay={0.3}>
          <Show when="signed-in">
            <Button asChild className={heroWhiteButtonClassName} size="sm">
              <Link href="/walks">Your walks</Link>
            </Button>
          </Show>
          <Show when="signed-out">
            <Button asChild className={heroWhiteButtonClassName} size="sm">
              <a href={signUpHref}>
                Join the group
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={signInHref}>Sign in</a>
            </Button>
          </Show>
        </FadeIn>
      </div>
    </section>
  );
}

import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { prisma } from "@/lib/db";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { accountPortalHref } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  let walksHref = "/dashboard";
  if (userId) {
    const row = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    if (row?.role === "ADMIN") walksHref = "/admin";
  }

  const [slides, testimonials] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
  ]);

  return (
    <div className="-mx-4 -my-8 md:-mx-8">
      <HeroSection
        signInHref={accountPortalHref("sign-in", `${origin}/dashboard`)}
        signUpHref={accountPortalHref("sign-up", `${origin}/dashboard`)}
        signedIn={Boolean(userId)}
        slides={slides}
        walksHref={walksHref}
      />
      <HomeWelcome testimonials={testimonials} />
    </div>
  );
}

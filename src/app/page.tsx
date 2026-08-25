import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { prisma } from "@/lib/db";
import { slideSrc } from "@/lib/slides";
import { AFTER_AUTH_PATH, accountPortalHref } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const afterAuth = `${proto}://${host}${AFTER_AUTH_PATH}`;

  const rows = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true, alt: true, imagePath: true, updatedAt: true },
  });

  const slides = rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    alt: row.alt,
    src: slideSrc(row),
  }));

  return (
    <div className="-mx-4 -my-8 md:-mx-8">
      <HeroSection
        signInHref={accountPortalHref("sign-in", afterAuth)}
        signUpHref={accountPortalHref("sign-up", afterAuth)}
        slides={slides}
      />
      <HomeWelcome />
    </div>
  );
}

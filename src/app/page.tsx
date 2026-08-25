import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeCarousel } from "@/components/home-carousel";
import { HomeWelcome } from "@/components/home-welcome";
import { prisma } from "@/lib/db";
import { slideSrc } from "@/lib/slides";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

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
    <div className="space-y-8">
      {slides.length > 0 && <HomeCarousel slides={slides} />}
      <HomeWelcome />
    </div>
  );
}

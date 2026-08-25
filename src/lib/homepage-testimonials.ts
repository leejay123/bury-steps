import { prisma } from "@/lib/db";
import { testimonialSrc, type TestimonialView } from "@/lib/testimonials";

export async function getHomepageTestimonials(): Promise<TestimonialView[]> {
  const rows = await prisma.homepageTestimonial.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      name: true,
      role: true,
      quote: true,
      imagePath: true,
      imageMime: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    name: row.name,
    role: row.role,
    quote: row.quote,
    image: testimonialSrc(row),
  }));
}

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { isFaqCategory, type FaqView } from "@/lib/faqs";

async function loadHomepageFaqs(): Promise<FaqView[]> {
  const rows = await prisma.homepageFaq.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      category: true,
      question: true,
      answer: true,
    },
  });

  return rows.flatMap((row) => {
    if (!isFaqCategory(row.category)) return [];
    return [
      {
        id: row.id,
        sortOrder: row.sortOrder,
        category: row.category,
        question: row.question,
        answer: row.answer,
      },
    ];
  });
}

const getCachedHomepageFaqs = unstable_cache(loadHomepageFaqs, ["homepage-faqs"], {
  tags: [HOMEPAGE_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export async function getHomepageFaqs(): Promise<FaqView[]> {
  try {
    return await getCachedHomepageFaqs();
  } catch {
    return [];
  }
}

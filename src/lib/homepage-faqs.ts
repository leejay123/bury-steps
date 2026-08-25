import { prisma } from "@/lib/db";
import { isFaqCategory, type FaqView } from "@/lib/faqs";

export async function getHomepageFaqs(): Promise<FaqView[]> {
  try {
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
  } catch {
    return [];
  }
}

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import {
  DEFAULT_FAQ_CATEGORIES,
  type FaqCategoryView,
  type FaqView,
} from "@/lib/faqs";

export type HomepageFaqData = {
  faqs: FaqView[];
  categories: FaqCategoryView[];
};

export async function ensureDefaultFaqCategories() {
  const count = await prisma.homepageFaqCategory.count();
  if (count > 0) return;

  try {
    await prisma.homepageFaqCategory.createMany({
      data: DEFAULT_FAQ_CATEGORIES.map((category) => ({
        id: category.id,
        slug: category.slug,
        label: category.label,
        sortOrder: category.sortOrder,
      })),
    });
  } catch {
    // Another request may have created them at the same time.
  }
}

export async function loadHomepageFaqData(): Promise<HomepageFaqData> {
  const [faqRows, categoryRows] = await Promise.all([
    prisma.homepageFaq.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        sortOrder: true,
        question: true,
        answer: true,
        categoryId: true,
        category: { select: { label: true } },
      },
    }),
    prisma.homepageFaqCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        label: true,
        sortOrder: true,
        _count: { select: { faqs: true } },
      },
    }),
  ]);

  return {
    faqs: faqRows.map((row) => ({
      id: row.id,
      sortOrder: row.sortOrder,
      categoryId: row.categoryId,
      categoryLabel: row.category.label,
      question: row.question,
      answer: row.answer,
    })),
    categories: categoryRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      sortOrder: row.sortOrder,
      faqCount: row._count.faqs,
    })),
  };
}

const getCachedHomepageFaqData = unstable_cache(loadHomepageFaqData, ["homepage-faq-data"], {
  tags: [HOMEPAGE_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export async function getHomepageFaqData(): Promise<HomepageFaqData> {
  try {
    return await getCachedHomepageFaqData();
  } catch {
    return { faqs: [], categories: [] };
  }
}

export async function getHomepageFaqs(): Promise<FaqView[]> {
  const { faqs } = await getHomepageFaqData();
  return faqs;
}

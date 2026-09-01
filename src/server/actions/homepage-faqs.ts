"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  MAX_FAQ_CATEGORIES,
  MAX_FAQ_CATEGORY_LABEL,
  MAX_HOMEPAGE_FAQS,
  faqCategorySlug,
} from "@/lib/faqs";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  applySortOrder,
  isPrismaCode,
  logActionError,
  revalidateHomepage,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

async function readFaqCopy(
  formData: FormData,
): Promise<{ categoryId: string; question: string; answer: string } | { error: string }> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!categoryId) return { error: "Choose a category." };
  const category = await prisma.homepageFaqCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) return { error: "Choose a category." };
  if (!question) return { error: "Add a question." };
  if (!answer) return { error: "Add an answer." };
  if (question.length > 160) return { error: "Keep the question under 160 characters." };
  if (answer.length > 1200) return { error: "Keep the answer under 1,200 characters." };
  return { categoryId, question, answer };
}

function readCategoryLabel(formData: FormData): { label: string } | { error: string } {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Add a category name." };
  if (label.length > MAX_FAQ_CATEGORY_LABEL) {
    return { error: `Keep the name under ${MAX_FAQ_CATEGORY_LABEL} characters.` };
  }
  return { label };
}

async function uniqueFaqCategorySlug(tx: Prisma.TransactionClient, label: string): Promise<string> {
  const base = faqCategorySlug(label);
  let slug = base;
  let n = 2;
  while (
    await tx.homepageFaqCategory.findFirst({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function addHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const copy = await readFaqCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaq, async (tx) => {
      const count = await tx.homepageFaq.count();
      if (count >= MAX_HOMEPAGE_FAQS) {
        throw new LimitReachedError("You can have up to 20 FAQs.");
      }
      await tx.homepageFaq.create({
        data: {
          sortOrder: count,
          categoryId: copy.categoryId,
          question: copy.question,
          answer: copy.answer,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    return logActionError("addHomepageFaq", err, "Could not add that FAQ. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ added." };
}

export async function updateHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("faqId") ?? "");
  if (!id) return { ok: false, error: "No FAQ selected." };

  const copy = await readFaqCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.homepageFaq.update({
      where: { id },
      data: {
        categoryId: copy.categoryId,
        question: copy.question,
        answer: copy.answer,
      },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateHomepageFaq", err);
    return { ok: false, error: "That FAQ is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ saved." };
}

export async function deleteHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("faqId") ?? "");
  if (!id) return { ok: false, error: "No FAQ selected." };

  try {
    await prisma.homepageFaq.delete({ where: { id } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteHomepageFaq", err);
    return { ok: false, error: "That FAQ is no longer there." };
  }

  try {
    const remaining = await prisma.homepageFaq.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((row, index) =>
        prisma.homepageFaq.update({ where: { id: row.id }, data: { sortOrder: index } }),
      ),
    );
  } catch (err) {
    logActionError("deleteHomepageFaq:resort", err);
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ removed." };
}

export async function reorderHomepageFaqs(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_HOMEPAGE_FAQS * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageFaq.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageFaq.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageFaqs", err, "Could not save that order. Try again.");
  }
  revalidateHomepage();
  return { ok: true };
}

export async function addHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const copy = readCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaqCategory, async (tx) => {
      const count = await tx.homepageFaqCategory.count();
      if (count >= MAX_FAQ_CATEGORIES) {
        throw new LimitReachedError(`You can have up to ${MAX_FAQ_CATEGORIES} categories.`);
      }
      await tx.homepageFaqCategory.create({
        data: {
          label: copy.label,
          slug: await uniqueFaqCategorySlug(tx, copy.label),
          sortOrder: count,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    // Two categories with the same name created at the same moment can both
    // pass the slug-uniqueness check above before either commits.
    if (isPrismaCode(err, "P2002")) {
      return { ok: false, error: "A category with that name was just added. Try a different name." };
    }
    return logActionError("addHomepageFaqCategory", err, "Could not add that category. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "Category added." };
}

export async function updateHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };

  const copy = readCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.homepageFaqCategory.update({
      where: { id },
      data: { label: copy.label },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateHomepageFaqCategory", err);
    return { ok: false, error: "That category is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Category saved." };
}

export async function deleteHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaqCategory, async (tx) => {
      const category = await tx.homepageFaqCategory.findUnique({
        where: { id },
        select: { id: true, _count: { select: { faqs: true } } },
      });
      if (!category) throw new Error("CATEGORY_GONE");

      const remaining = await tx.homepageFaqCategory.count();
      if (remaining <= 1) {
        throw new LimitReachedError("Keep at least one category.");
      }
      if (category._count.faqs > 0) {
        throw new LimitReachedError("Move or remove the FAQs in this category first.");
      }

      await tx.homepageFaqCategory.delete({ where: { id } });

      const leftover = await tx.homepageFaqCategory.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      for (const [index, row] of leftover.entries()) {
        await tx.homepageFaqCategory.update({
          where: { id: row.id },
          data: { sortOrder: index },
        });
      }
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "CATEGORY_GONE") {
      return { ok: false, error: "That category is no longer there." };
    }
    return logActionError("deleteHomepageFaqCategory", err, "Could not remove that category. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "Category removed." };
}

export async function reorderHomepageFaqCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_FAQ_CATEGORIES * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageFaqCategory.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageFaqCategory.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageFaqCategories", err, "Could not save that order. Try again.");
  }
  revalidateHomepage();
  return { ok: true };
}

import { cacheLife } from "next/cache";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { prisma } from "./db";

/**
 * How many rows the first page of a shared list shows — the same for every
 * organiser — so its loading placeholder draws exactly that many, never
 * more than are really there. Saved copies shared by every server. Each is
 * made while drawing that list's page, so the page's own refresh after any
 * save (revalidatePath) refreshes it too (the Next.js docs, revalidatePath:
 * "Cache entries are tagged based on which route file renders them"); the
 * one-minute refresh catches anything else, like someone new joining.
 *
 * `undefined` when the database can't be reached (e.g. while building):
 * the placeholder then uses this browser's count from last time instead.
 */
async function firstPage(count: () => Promise<number>): Promise<number | undefined> {
  try {
    return Math.min(await count(), LIST_PAGE_SIZE);
  } catch {
    return undefined;
  }
}

async function cachedMessagesCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 });
  return prisma.contactMessage.count();
}

async function cachedReportsCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 });
  return prisma.accidentReport.count();
}

async function cachedMembersCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 });
  return prisma.user.count();
}

export const messagesListRows = () => firstPage(cachedMessagesCount);
export const reportsListRows = () => firstPage(cachedReportsCount);
export const membersListRows = () => firstPage(cachedMembersCount);

async function cachedNewsletterCounts(): Promise<{ members: number; footer: number }> {
  "use cache: remote";
  cacheLife({ revalidate: 300 });
  const [members, footer] = await Promise.all([
    prisma.user.count({ where: { emailNewsletter: true } }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  return { members: Math.min(members, 200), footer: Math.min(footer, 200) };
}

/** How many newsletter rows the Subscribers page lists (members, then footer
 * signups), for its placeholder — counts only, never who. */
export async function newsletterListRows(): Promise<{ members: number; footer: number } | undefined> {
  try {
    return await cachedNewsletterCounts();
  } catch {
    return undefined;
  }
}

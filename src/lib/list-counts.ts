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

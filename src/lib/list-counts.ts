import { loadMembersPage } from "@/lib/members-search";
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

// Only how many grey rows the placeholder shows, so an hour old is fine:
// at 1 minute, these lists' ready-made pages were rebuilt every minute,
// and each rebuild can be an ISR write on Vercel.
async function cachedMessagesCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 * 60 });
  return prisma.contactMessage.count();
}

async function cachedReportsCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 * 60 });
  return prisma.accidentReport.count();
}

async function cachedMembersCount(): Promise<number> {
  "use cache: remote";
  cacheLife({ revalidate: 60 * 60 });
  return prisma.user.count();
}

export const messagesListRows = () => firstPage(cachedMessagesCount);
export const reportsListRows = () => firstPage(cachedReportsCount);
export const membersListRows = () => firstPage(cachedMembersCount);
/** Every member (for the page-number row's "1–20 of 60 members"); undefined when it can't be read. */
export async function membersListTotal(): Promise<number | undefined> {
  try {
    return await cachedMembersCount();
  } catch {
    return undefined;
  }
}

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

/**
 * How many of the Members list's first page fall in each group (Owner, Organisers,
 * Members; empty groups left out), as the page shows it with no search or filter:
 * the same for every organiser, so its placeholder can draw the group strips where
 * the real list will. Refreshed hourly, with the members count.
 */
/** One group of the first page: owners or not, and for each row whether it shows an invite
 * note (so the row keeps its actions line on phones, whoever is looking). */
export type MembersPageGroup = { owner: boolean; invites: boolean[] };

async function cachedMembersFirstPageGroups(): Promise<MembersPageGroup[]> {
  "use cache: remote";
  cacheLife({ revalidate: 60 * 60 });
  const { rows } = await loadMembersPage({});
  const pick = (owner: boolean, keep: (row: (typeof rows)[number]) => boolean): MembersPageGroup => ({
    owner,
    invites: rows.filter(keep).map((row) => Boolean(row.pendingInvite)),
  });
  return [
    pick(true, (row) => row.isOwner),
    pick(false, (row) => !row.isOwner && row.role === "ADMIN"),
    pick(false, (row) => !row.isOwner && row.role !== "ADMIN"),
  ].filter((group) => group.invites.length > 0);
}

export async function membersFirstPageGroups(): Promise<MembersPageGroup[] | undefined> {
  try {
    const groups = await cachedMembersFirstPageGroups();
    // A saved copy from an older shape (or anything unexpected): the plain placeholder instead.
    return Array.isArray(groups) && groups.every((group) => Array.isArray(group?.invites)) ? groups : undefined;
  } catch {
    return undefined;
  }
}

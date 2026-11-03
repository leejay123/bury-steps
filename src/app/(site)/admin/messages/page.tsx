import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { AdminListFallback, AdminPageFallback } from "@/app/(site)/admin/admin-page-fallback";
import { MessagesFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { MessageRowsSkeleton } from "@/components/list-skeletons";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import Link from "next/link";
import { getOptionalAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { getContactMessagesDescription } from "@/lib/contact-messages-owner";
import { messagesListRows } from "@/lib/list-counts";
import { prisma } from "@/lib/db";
import { AdminPageIntro } from "../admin-page-intro";
import { ContactMessagesList } from "./contact-messages-list";



/**
 * The Messages list, as a private saved copy: kept in this browser only for
 * five minutes (never on the server), so the page fetched ahead from the
 * menu can carry it and opens with no placeholder. A new message, or
 * marking one read, refreshes it at once. See node_modules/next/dist/docs/
 * 01-app/02-guides/optimizing-prefetching.md.
 */
async function getMessagesView() {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const admin = await getOptionalAdmin();
  if (!admin?.permMessages) return null;
  const [messages, description] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getContactMessagesDescription(),
  ]);
  return { messages, description };
}

/** The title and description (who gets alerted, from a saved copy): part of the ready-made page. */
async function MessagesIntro() {
  const description = await getContactMessagesDescription();
  return (
    <>
      <AdminPageIntro description={description.text} title="Messages" />
      {!description.hasOwner ? (
        <p className="text-sm text-muted-foreground">
          <Link className="underline underline-offset-2" href="/admin/settings/behaviour#contact-messages">
            Choose who gets alerted
          </Link>
        </p>
      ) : null}
    </>
  );
}

/** The part that waits for data: the messages (organisers allowed to see them). */
async function MessagesList() {
  const view = await getMessagesView();
  if (!view) notFound();
  const { messages } = view;
  return (
    <>
      <RememberListCount count={Math.min(messages.length, LIST_PAGE_SIZE)} id="messages" />
      <ContactMessagesList
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          email: message.email,
          phone: message.phone,
          message: message.message,
          createdAt: message.createdAt.toISOString(),
          read: message.readAt !== null,
        }))}
      />
    </>
  );
}

/** The list's placeholder: the real search and date filter, then as many rows as there are (list-counts.ts). */
async function MessagesListFallback() {
  const rows = await messagesListRows();
  return (
    <AdminListFallback
      filters={<MessagesFilterChrome />}
      list={<MessageRowsSkeleton known={rows} remember="messages" />}
    />
  );
}

/** Real title, description, search and date filter, then exactly as many
 * message rows as there are (list-counts.ts) — one placeholder from the first paint. The description
 * names who gets alerted, from a saved copy, so it's real too. */
export async function MessagesPageFallback() {
  const [description, rows] = await Promise.all([getContactMessagesDescription(), messagesListRows()]);
  return (
    <AdminPageFallback
      description={description.text}
      filters={<MessagesFilterChrome />}
      list={<MessageRowsSkeleton known={rows} remember="messages" />}
      title="Messages"
    />
  );
}

// Access is checked in proxy.ts, and the list checks the database itself.
/** Fetched ahead from the menu (navLinkPrefetch), so it opens with the messages there. */
export const prefetch = "partial";

export default function AdminMessagesPage() {
  // The title and description draw at once (the ready-made page); only the
  // list waits for its data, behind its own placeholder (Next.js docs:
  // optimizing-the-static-shell).
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <MessagesIntro />
      <Suspense fallback={<MessagesListFallback />}>
        <PlaceholderPreview fallback={<MessagesListFallback />}>
          <MessagesList />
        </PlaceholderPreview>
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import { MessagesFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { MessageRowsSkeleton } from "@/components/list-skeletons";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getContactMessagesDescription } from "@/lib/contact-messages-owner";
import { prisma } from "@/lib/db";
import { AdminPageIntro } from "../admin-page-intro";
import { ContactMessagesList } from "./contact-messages-list";



async function AdminMessagesPageContent() {
  await requirePermission("permMessages");

  const [messages, description] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getContactMessagesDescription(),
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <RememberListCount count={Math.min(messages.length, LIST_PAGE_SIZE)} id="messages" />
      <AdminPageIntro description={description.text} title="Messages" />
      {!description.hasOwner ? (
        <p className="text-sm text-muted-foreground">
          <Link className="underline underline-offset-2" href="/admin/settings/behaviour#contact-messages">
            Choose who gets alerted
          </Link>
        </p>
      ) : null}
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
    </div>
  );
}

/** Real title, description, search and date filter, then as many message
 * rows as last time — one placeholder from the first paint. The description
 * names who gets alerted, from a saved copy, so it's real too. */
export async function MessagesPageFallback() {
  const description = await getContactMessagesDescription();
  return (
    <AdminPageFallback
      description={description.text}
      filters={<MessagesFilterChrome />}
      list={<MessageRowsSkeleton remember="messages" />}
      title="Messages"
    />
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
// Access is checked in layout.tsx, before anything streams.
export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<MessagesPageFallback />}>
      <PlaceholderPreview fallback={<MessagesPageFallback />}>
        <AdminMessagesPageContent />
      </PlaceholderPreview>
    </Suspense>
  );
}

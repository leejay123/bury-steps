import { Suspense } from "react";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import { MessagesFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { MessageRowsSkeleton } from "@/components/list-skeletons";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { MESSAGE_LINES_COOKIE } from "@/lib/remembered-rows-key";
import { rememberedCount, rememberedLines } from "@/lib/remembered-rows";
import Link from "next/link";
import { requirePermission, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { AdminPageIntro } from "../admin-page-intro";
import { ContactMessagesList } from "./contact-messages-list";



async function AdminMessagesPageContent() {
  await requirePermission("permMessages");

  const [messages, setting] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { contactMessagesOwner: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);
  const owner = setting?.contactMessagesOwner;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <RememberListCount count={Math.min(messages.length, LIST_PAGE_SIZE)} id="messages" />
      <AdminPageIntro
        description={
          owner
            ? `Submissions from the public Contact us form. ${displayName(owner)} gets an email alert for each new one and can reply straight from it — nothing else happens automatically.`
            : "Submissions from the public Contact us form. No one is set to be alerted by email yet — set that in Settings → Site behaviour → Contact messages."
        }
        title="Messages"
      />
      {!owner ? (
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

/** Real title, search and date filter. Grey rows only for the messages last shown. */
export function MessagesPageFallback({
  rows,
  lines = null,
}: {
  rows: number | null;
  lines?: string[] | null;
}) {
  return (
    <AdminPageFallback
      filters={rows === 0 ? null : <MessagesFilterChrome />}
      list={<MessageRowsSkeleton lines={lines} rows={rows ?? 0} />}
      title="Messages"
    />
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<MessagesPageFallback rows={null} />}>
      <MessagesCounted />
    </Suspense>
  );
}

async function MessagesCounted() {
  const [rows, lines] = await Promise.all([
    rememberedCount("messages"),
    rememberedLines(MESSAGE_LINES_COOKIE),
  ]);
  return (
    <Suspense fallback={<MessagesPageFallback lines={lines} rows={rows} />}>
      <AdminMessagesPageContent />
    </Suspense>
  );
}

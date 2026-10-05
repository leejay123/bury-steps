import { Suspense } from "react";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import { MessageRowsSkeleton } from "@/components/list-skeletons";
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
    <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
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

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
// Access is checked in layout.tsx, before anything streams.
export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<AdminPageFallback list={<MessageRowsSkeleton />} title="Messages" />}>
      <AdminMessagesPageContent />
    </Suspense>
  );
}

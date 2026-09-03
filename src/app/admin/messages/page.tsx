import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageIntro } from "../admin-page-intro";
import { ContactMessagesList } from "./contact-messages-list";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Submissions from the public Contact us form. Nothing is emailed out — check back here."
        title="Messages"
      />
      <ContactMessagesList
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          email: message.email,
          message: message.message,
          createdAt: message.createdAt.toISOString(),
          read: message.readAt !== null,
        }))}
      />
    </div>
  );
}

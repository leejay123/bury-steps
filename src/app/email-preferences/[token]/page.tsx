import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PAGE_X } from "@/lib/page-x";
import { EmailPreferencesForm } from "./email-preferences-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email preferences",
};

export default async function EmailPreferencesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const member = await prisma.user.findUnique({
    where: { unsubscribeToken: token },
    select: {
      email: true,
      emailWalkAnnouncements: true,
      emailNotices: true,
      emailProgress: true,
      emailNewsletter: true,
    },
  });
  if (!member) notFound();

  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-6 py-12 ${PAGE_X}`}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Email preferences</h1>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>
      <EmailPreferencesForm
        emailNewsletter={member.emailNewsletter}
        emailNotices={member.emailNotices}
        emailProgress={member.emailProgress}
        emailWalkAnnouncements={member.emailWalkAnnouncements}
        token={token}
      />
    </div>
  );
}

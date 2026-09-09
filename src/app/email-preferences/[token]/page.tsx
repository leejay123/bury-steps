import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
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
      role: true,
      emailWalkAnnouncements: true,
      emailNotices: true,
      emailProgress: true,
      emailNewsletter: true,
      emailAccidentAlerts: true,
    },
  });
  if (!member) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Email preferences</h1>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>
      <EmailPreferencesForm
        emailAccidentAlerts={member.emailAccidentAlerts}
        emailNewsletter={member.emailNewsletter}
        emailNotices={member.emailNotices}
        emailProgress={member.emailProgress}
        emailWalkAnnouncements={member.emailWalkAnnouncements}
        isAdmin={member.role === "ADMIN"}
        token={token}
      />
    </div>
  );
}

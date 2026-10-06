import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { MailX } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { EmailPreferencesForm } from "./email-preferences-form";



export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

async function EmailPreferencesPageContent({
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
  // An old or mistyped link: say so and point to the signed-in page,
  // rather than a bare "page not found".
  if (!member) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold tracking-tight">Email preferences</h1>
        <EmptyState
          description="This link from an email no longer works. Sign in to choose which emails you get."
          icon={MailX}
          title="This link has stopped working"
        />
        <Button asChild className="self-start">
          <Link href="/email-preferences">Sign in to your email preferences</Link>
        </Button>
      </div>
    );
  }

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

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function EmailPreferencesPage(props: Parameters<typeof EmailPreferencesPageContent>[0]) {
  return (
    <Suspense fallback={<PageFallback />}>
      <EmailPreferencesPageContent {...props} />
    </Suspense>
  );
}

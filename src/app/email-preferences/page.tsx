import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vapidConfig } from "@/lib/vapid";
import { PhoneAlertsSwitch } from "@/components/phone-alerts-switch";
import { MyEmailPreferencesForm } from "./my-email-preferences-form";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};


/** Reached from the account menu (SiteUserButton) — works for members and
 * organisers alike, acting on whichever account is signed in. The
 * token-based page at /email-preferences/[token] covers the same ground
 * for someone who followed a link from an email without signing in first. */
export default async function MyEmailPreferencesPage() {
  const user = await requireUser();
  const pushOn =
    (await prisma.pushSubscription.findFirst({ where: { userId: user.id }, select: { id: true } })) != null;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Email preferences</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <MyEmailPreferencesForm
        emailAccidentAlerts={user.emailAccidentAlerts}
        emailNewsletter={user.emailNewsletter}
        emailNotices={user.emailNotices}
        emailProgress={user.emailProgress}
        emailWalkAnnouncements={user.emailWalkAnnouncements}
        isAdmin={user.role === "ADMIN"}
      />
      <PhoneAlertsSwitch initiallyOn={pushOn} vapidPublicKey={vapidConfig()?.publicKey ?? null} />
    </div>
  );
}

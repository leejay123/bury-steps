import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X } from "@/lib/page-x";
import { MyEmailPreferencesForm } from "./my-email-preferences-form";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Reached from the account menu (SiteUserButton) — works for members and
 * organisers alike, acting on whichever account is signed in. The
 * token-based page at /email-preferences/[token] covers the same ground
 * for someone who followed a link from an email without signing in first. */
export default async function MyEmailPreferencesPage() {
  const user = await requireUser();

  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-6 py-12 ${PAGE_X}`}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Email preferences</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <MyEmailPreferencesForm
        emailNewsletter={user.emailNewsletter}
        emailNotices={user.emailNotices}
        emailOrganiserAlerts={user.emailOrganiserAlerts}
        emailProgress={user.emailProgress}
        emailWalkAnnouncements={user.emailWalkAnnouncements}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteTheme } from "@/lib/site-theme";
import { PAGE_X } from "@/lib/page-x";
import { appUrl, accountPortalHref } from "@/lib/urls";
import { AcceptInviteForm } from "./accept-invite-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organiser invite",
  robots: { index: false, follow: false },
};

/** Reached from the link in the organiser-invite email. Deliberately
 * requires a real button click on AcceptInviteForm below (not an
 * auto-submit on load) — this grants real admin access on a single-use
 * token, and an automated pre-fetch of the link (Outlook Safe Links, Gmail
 * link scanning, corporate security gateways) would otherwise burn the
 * token before the actual person ever opens it. */
export default async function OrganiserInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invitee, theme] = await Promise.all([
    prisma.user.findUnique({
      where: { organiserInviteToken: token },
      select: { role: true, organiserInviteExpiresAt: true },
    }),
    getSiteTheme(),
  ]);

  const now = new Date();
  const expired = !invitee?.organiserInviteExpiresAt || invitee.organiserInviteExpiresAt < now;
  const invalid = !invitee || invitee.role !== "MEMBER";

  return (
    <div className={`mx-auto w-full max-w-md py-16 ${PAGE_X}`}>
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/30 p-6 text-center md:p-12">
        <h1 className="text-2xl font-semibold tracking-tight">Become an organiser</h1>
        {invalid ? (
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has already been used.
          </p>
        ) : expired ? (
          <p className="text-sm text-muted-foreground">
            This invite link has expired. Ask an organiser to send you a new one.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You&rsquo;ve been invited to become an organiser of {theme.siteName}. Accepting gives
              you access to manage walks, members, and settings.
            </p>
            <AcceptInviteForm
              signInHref={accountPortalHref("sign-in", `${appUrl()}/admin/members`)}
              token={token}
            />
          </>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteTheme } from "@/lib/site-theme";
import { PAGE_X } from "@/lib/page-x";
import { AcceptInviteForm } from "./accept-invite-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organiser invite",
  robots: { index: false, follow: false },
};

/** Reached from the link in the organiser-invite email — no sign-in
 * required, same trust model as the email-preferences token pages (see
 * acceptOrganiserInvite). Requires an explicit click, unlike the
 * newsletter-unsubscribe token page, since this one grants real access. */
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
    <div className={`mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center ${PAGE_X}`}>
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
            You&rsquo;ve been invited to become an organiser of {theme.siteName}. Accepting gives you
            access to manage walks, members, and settings.
          </p>
          <AcceptInviteForm token={token} />
        </>
      )}
    </div>
  );
}

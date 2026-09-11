import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { appUrl, accountPortalHref } from "@/lib/urls";
import { AcceptInviteForm } from "./accept-invite-form";
import { WrongAccountNotice } from "./wrong-account-notice";

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
 * token before the actual person ever opens it.
 *
 * Also gated on *who's* opening it, not just the token: a signed-out
 * browser is sent to sign in first (an invite is always to an existing
 * member — promoting someone already implies an account), and a browser
 * signed in as someone other than the invitee is shown a clear notice
 * rather than silently accepting on the wrong account. */
export default async function OrganiserInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invitee, theme] = await Promise.all([
    prisma.user.findUnique({
      where: { organiserInviteToken: token },
      select: { id: true, email: true, firstName: true, role: true, organiserInviteExpiresAt: true },
    }),
    getSiteTheme(),
  ]);

  const now = new Date();
  const expired = !invitee?.organiserInviteExpiresAt || invitee.organiserInviteExpiresAt < now;
  const invalid = !invitee || invitee.role !== "MEMBER";
  const inviteeName = invitee?.firstName?.trim() || "there";

  const inviteUrl = `${appUrl()}/organiser-invite/${token}`;
  const signInHref = accountPortalHref("sign-in", inviteUrl);

  // No point asking who's signed in for a token that's already invalid —
  // that message should show regardless of the viewer's own sign-in state.
  let wrongAccount = false;
  if (!invalid && !expired) {
    const viewer = await getOptionalUser();
    if (!viewer) redirect(signInHref);
    wrongAccount = viewer.id !== invitee.id;
  }

  return (
    <div className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/30 p-6 text-center md:p-12">
      <h1 className="text-2xl font-semibold tracking-tight">Become an organiser</h1>
      {invalid ? (
        <p className="text-sm text-muted-foreground">
          This invite link is invalid or has already been used.
        </p>
      ) : expired ? (
        <p className="text-sm text-muted-foreground">
          This invite link has expired. Ask an organiser to send you a new one.
        </p>
      ) : wrongAccount ? (
        <>
          <p className="text-sm text-muted-foreground">
            This invite is for <strong>{invitee.email}</strong>. You&rsquo;re signed in as a
            different account. Sign out and sign back in as {invitee.email} to accept it.
          </p>
          <WrongAccountNotice signInHref={signInHref} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Hi {inviteeName}, this invite is for <strong>{invitee.email}</strong>. Accepting gives
            you organiser access on {theme.siteName}.
          </p>
          <div className="w-full max-w-sm text-left">
            <p className="text-sm font-medium">As an organiser, you&rsquo;ll be able to:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground [&_li]:mt-1.5">
              <li>Create, edit, and cancel walks, and share their links</li>
              <li>See who&rsquo;s coming on a walk, including any health notes shared for it</li>
              <li>Record accident reports if something happens on a walk</li>
              <li>Manage members — promote, demote, or remove someone</li>
              <li>Edit homepage content and site settings</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              This is real access to other members&rsquo; personal details — please only use it
              for group business, and keep what you see private.
            </p>
          </div>
          <AcceptInviteForm token={token} />
        </>
      )}
    </div>
  );
}

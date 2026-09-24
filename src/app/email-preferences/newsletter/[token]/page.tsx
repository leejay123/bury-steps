import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PAGE_X } from "@/lib/page-x";
import { NewsletterUnsubscribeForm } from "./unsubscribe-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * The newsletter footer's unsubscribe link. Public (see PUBLIC_ROUTES in
 * src/proxy.ts) — footer subscribers have no account — and gated by the
 * subscriber's own unguessable token. Deliberately does NOT unsubscribe
 * just by being opened: email security scanners open links to check them,
 * which silently unsubscribed people. The person confirms with a button.
 */
export default async function NewsletterUnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const subscriber = await prisma.newsletterSubscriber
    .findUnique({ where: { unsubscribeToken: token }, select: { email: true, unsubscribedAt: true } })
    .catch(() => null);

  const heading = !subscriber
    ? "Link not found"
    : subscriber.unsubscribedAt
      ? "You're already unsubscribed"
      : "Unsubscribe from the newsletter";

  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-3 py-16 text-center ${PAGE_X}`}>
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      {!subscriber ? (
        <p className="text-sm text-muted-foreground">
          This unsubscribe link is invalid. Try the link in your most recent email.
        </p>
      ) : subscriber.unsubscribedAt ? (
        <p className="text-sm text-muted-foreground">
          {subscriber.email} won&apos;t get any more newsletter emails from us. You can subscribe
          again any time from the homepage.
        </p>
      ) : (
        <NewsletterUnsubscribeForm email={subscriber.email} token={token} />
      )}
    </div>
  );
}

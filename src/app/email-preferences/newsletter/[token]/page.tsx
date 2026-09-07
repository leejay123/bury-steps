import type { Metadata } from "next";
import { unsubscribeFromNewsletter } from "@/server/actions";
import { PAGE_X } from "@/lib/page-x";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
};

export default async function NewsletterUnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ok = await unsubscribeFromNewsletter(token);

  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-2 py-16 text-center ${PAGE_X}`}>
      <h1 className="text-2xl font-semibold tracking-tight">
        {ok ? "You've been unsubscribed" : "Link not found"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {ok
          ? "You won't get any more newsletter emails from us. You can subscribe again any time from the homepage."
          : "This unsubscribe link is invalid or has already been used."}
      </p>
    </div>
  );
}

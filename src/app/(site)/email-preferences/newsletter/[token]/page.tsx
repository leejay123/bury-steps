import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import type { Metadata } from "next";
import { PAGE_X } from "@/lib/page-x";
import { ConfirmNewsletterUnsubscribeForm } from "./confirm-unsubscribe-form";



export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

async function NewsletterUnsubscribePageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-2 py-16 text-center ${PAGE_X}`}>
      <h1 className="text-2xl font-semibold tracking-tight">Unsubscribe</h1>
      <ConfirmNewsletterUnsubscribeForm token={token} />
    </div>
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function NewsletterUnsubscribePage(props: Parameters<typeof NewsletterUnsubscribePageContent>[0]) {
  return (
    <Suspense fallback={<PageFallback />}>
      <NewsletterUnsubscribePageContent {...props} />
    </Suspense>
  );
}

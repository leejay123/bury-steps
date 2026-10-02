import type { Metadata } from "next";
import { PAGE_X } from "@/lib/page-x";
import { ConfirmNewsletterUnsubscribeForm } from "./confirm-unsubscribe-form";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
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

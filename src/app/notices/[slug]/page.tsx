import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOptionalUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { accountPortalHref, appUrl } from "@/lib/urls";
import { getPageNoticeBySlug, recordSiteNoticeRead } from "@/lib/site-notices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  if (!notice) return { title: "Notice not found — Bury Steps Walking Group" };
  return {
    title: `${notice.title} — Bury Steps Walking Group`,
    description: notice.body,
    robots:
      notice.audience === "PUBLIC" || notice.audience === "VISITORS"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  if (!notice || !notice.pageBody) notFound();

  const user = await getOptionalUser();

  if (notice.audience === "MEMBERS" && !user) {
    const returnTo = `${appUrl()}/notices/${slug}`;
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-10 md:px-6">
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/notices">
          ← All notices
        </Link>
        <div className="space-y-4 rounded-lg border bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-medium">Members only</p>
            <p className="text-sm text-muted-foreground">
              This notice is for signed-in members. Sign in or create an account to read it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={accountPortalHref("sign-up", returnTo)}>Create an account</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={accountPortalHref("sign-in", returnTo)}>Sign in</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    after(async () => {
      try {
        await recordSiteNoticeRead(user.id, notice.id);
        revalidatePath("/", "layout");
      } catch {
        // Read receipts are best-effort; don't fail the page.
      }
    });
  }

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/notices">
        ← All notices
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {notice.categoryLabel ? <Badge variant="secondary">{notice.categoryLabel}</Badge> : null}
          {notice.audience === "PUBLIC" ? <Badge variant="outline">Everyone</Badge> : null}
          {notice.audience === "VISITORS" ? <Badge variant="outline">Visitors</Badge> : null}
          <time className="text-sm text-muted-foreground">{formatDate(notice.createdAt)}</time>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{notice.title}</h1>
        {notice.body ? (
          <p className="text-lg text-muted-foreground">{notice.body}</p>
        ) : null}
      </header>
      <div className="whitespace-pre-wrap text-base leading-relaxed">{notice.pageBody}</div>
    </article>
  );
}

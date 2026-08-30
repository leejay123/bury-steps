import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getPageNoticeBySlug, recordSiteNoticeRead } from "@/lib/site-notices";
import { Badge } from "@/components/ui/badge";

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
    robots: { index: false, follow: false },
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  if (!notice || !notice.pageBody) notFound();

  after(async () => {
    try {
      await recordSiteNoticeRead(user.id, notice.id);
      revalidatePath("/", "layout");
    } catch {
      // Read receipts are best-effort; don't fail the page.
    }
  });

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/notices">
        ← All notices
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {notice.categoryLabel ? <Badge variant="secondary">{notice.categoryLabel}</Badge> : null}
          <time className="text-sm text-muted-foreground" dateTime={notice.updatedAt.toISOString()}>
            Updated {formatDate(notice.updatedAt)}
          </time>
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

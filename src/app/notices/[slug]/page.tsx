import NoticeLoading from "./loading";
import { previewingPlaceholders } from "@/lib/placeholder-preview";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { DescriptionText } from "@/components/description-text";
import Link from "next/link";
import { FileX } from "lucide-react";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { noticeDateLabel } from "@/lib/notices";
import { getPageNoticeBySlug } from "@/lib/site-notices";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { MarkNoticeReadOnView } from "./mark-notice-read-on-view";



export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // The tab title is the notice's own heading, so only for members.
  if (!(await getOptionalUser())) return { title: "Notice", robots: { index: false, follow: false } };
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  if (!notice || !notice.pageBody) return { title: "Notice removed", robots: { index: false, follow: false } };
  return {
    title: notice.title,
    description: notice.body,
    robots: { index: false, follow: false },
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  // Temporary owner tool: show this page's placeholder instead (loading.tsx).
  if (await previewingPlaceholders()) return <NoticeLoading />;
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  // Removed, or turned back into a bell-only notice, since the link went
  // out: say so, with the way back to the list.
  if (!notice || !notice.pageBody) {
    return (
      <div className="flex w-full flex-col gap-6">
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/notices">
          ← All notices
        </Link>
        <EmptyState
          description="The organisers have taken this notice down, or moved it. The latest ones are on Notices."
          icon={FileX}
          title="This notice isn’t here any more"
        />
      </div>
    );
  }

  return (
    // No padding of its own: <main> already gives every page its frame, and
    // this used to sit further in and lower than every other page.
    <article className="flex w-full flex-col gap-6">
      <MarkNoticeReadOnView noticeId={notice.id} />
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/notices">
        ← All notices
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {notice.categoryLabel ? <Badge variant="secondary">{notice.categoryLabel}</Badge> : null}
          <time className="text-sm text-muted-foreground" dateTime={notice.updatedAt.toISOString()}>
            {noticeDateLabel(notice)}
          </time>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight wrap-break-word md:text-4xl">{notice.title}</h1>
        {notice.body ? (
          <p className="text-intro text-muted-foreground wrap-break-word">{notice.body}</p>
        ) : null}
      </header>
      {/* The site's own font, like the title above it: the docs preset's
          Geist only started loading once this text appeared, so the
          article reflowed as it swapped in, and mixed two typefaces. */}
      <div
        className="typeset typeset-docs max-w-[90ch]"
        style={{ "--typeset-font-body": "inherit" } as CSSProperties}
      >
        <DescriptionText className="block" text={notice.pageBody} />
      </div>
    </article>
  );
}

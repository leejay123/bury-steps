import NoticeLoading from "./loading";
import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import { DescriptionText } from "@/components/description-text";
import Link from "next/link";
import { FileX } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { noticeDateLabel } from "@/lib/notices";
import { getPageNoticeBySlug, getPageNotices } from "@/lib/site-notices";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { MarkNoticeReadOnView } from "./mark-notice-read-on-view";



/**
 * Fetched ahead from the Notices list (its links use prefetch={true}), so a
 * notice opens with no placeholder. Each notice is a shared saved copy, so
 * that costs no database work. See node_modules/next/dist/docs/01-app/
 * 02-guides/optimizing-prefetching.md.
 */
export const prefetch = "partial";

/**
 * Every notice's page is made ahead of time, so opening one directly, or
 * refreshing it, shows it straight away. Notices added later are made the
 * first time someone opens them. Only signed-in people are ever sent these
 * pages: the sign-in check in proxy.ts runs before any of this.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const notices = await getPageNotices();
  const slugs = notices.flatMap((notice) => (notice.slug && notice.pageBody ? [{ slug: notice.slug }] : []));
  // Next.js needs at least one; this one shows "This notice isn't here any more".
  return slugs.length > 0 ? slugs : [{ slug: "none-yet" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // The tab title is the notice's own heading; only members get here (proxy.ts).
  const { slug } = await params;
  const notice = await getPageNoticeBySlug(slug);
  if (!notice || !notice.pageBody) return { title: "Notice removed", robots: { index: false, follow: false } };
  return {
    title: notice.title,
    description: notice.body,
    robots: { index: false, follow: false },
  };
}

export default function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      {/* The usual sign-in check (proxy.ts already made it), kept beside the
          notice rather than in front of it, so the notice isn't held back. */}
      <Suspense fallback={null}>
        <SignedInCheck />
      </Suspense>
      <Suspense fallback={<NoticeLoading />}>
        <NoticeContent params={params} />
      </Suspense>
    </>
  );
}

async function SignedInCheck() {
  await requireUser();
  return null;
}

async function NoticeContent({ params }: { params: Promise<{ slug: string }> }) {
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

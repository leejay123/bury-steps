import type { Metadata } from "next";
import { OfflinePage } from "@/components/not-found";
import { PageKindMark } from "@/components/shadcnio/page-kind";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Shown by the service worker when a page can't be loaded and isn't saved on
 * the phone. The same standalone page as Not found (no header or footer), so
 * they always look alike. No prefetching: there's no signal to fetch with.
 */
export default function Offline() {
  return (
    <>
      <PageKindMark kind="home" />
      <OfflinePage />
    </>
  );
}

import { NotFoundPage } from "@/components/not-found";
import { PageKindMark } from "@/components/shadcnio/page-kind";

/**
 * Every missing page, on its own as shadcn.io's is: no header, sidebar or
 * footer. Unmatched addresses come here, and so does notFound() from any page
 * under (site) — there's no (site)/not-found.tsx, so Next.js uses this one,
 * outside the dashboard layout (docs: file-conventions/not-found).
 */
export default function NotFound() {
  return (
    <>
      {/* "home": it draws its whole own page (page-kind.tsx). */}
      <PageKindMark kind="home" />
      <NotFoundPage />
    </>
  );
}

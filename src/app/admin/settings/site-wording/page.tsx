import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * "Site wording" used to be one page stacking 5 unrelated forms (How this
 * started, About lists, Testimonials heading, FAQ heading, Walk page
 * cards) — split into its own sub-pages (see the sidebar's "Site wording"
 * children in ../settings-sidebar.tsx) so each is its own short page.
 * The bare URL still works — for old links/bookmarks — by landing on the
 * first one.
 */
export default function SiteWordingIndexPage() {
  redirect("/admin/settings/site-wording/how-this-started");
}

import { redirect } from "next/navigation";
import { SITE_WORDING_PAGES } from "@/lib/settings-pages";

export const dynamic = "force-dynamic";

/**
 * Site wording is five short pages (see SITE_WORDING_PAGES), reached from
 * the Settings table or the tabs across the top of each one. The bare URL
 * still works, for old links and bookmarks, by landing on the first.
 */
export default function SiteWordingIndexPage() {
  redirect(SITE_WORDING_PAGES[0].href);
}

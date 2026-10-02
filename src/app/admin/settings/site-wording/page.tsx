import { redirect } from "next/navigation";
import { SITE_WORDING_PAGES } from "@/lib/settings-pages";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


/**
 * Site wording is five short pages (see SITE_WORDING_PAGES), reached from
 * the Settings table or the tabs across the top of each one. The bare URL
 * still works, for old links and bookmarks, by landing on the first.
 */
export default function SiteWordingIndexPage() {
  redirect(SITE_WORDING_PAGES[0].href);
}

import { NextResponse, type NextRequest } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { getProgressEnabled } from "@/lib/progress-settings";
import { navItems } from "@/components/site-nav-items";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";
import {
  AVATAR_COOKIE,
  BAR_COOKIE,
  BOTTOM_BAR_TABS,
  MENU_FILLED_COOKIE,
  NAV_COOKIE,
  safeNext,
} from "@/lib/remembered-nav";

/** Same lifetime as writeClientCookie, so these behave like the ones the browser saves. */
const MONTH = 60 * 60 * 24 * 30;

/**
 * Right after signing in there is no remembered menu yet (it's saved by the
 * browser once the real menu has loaded, and wiped on sign-out), so the first
 * page drew no menu at all until the server sent it. The proxy sends that
 * first page here: save the same menu the header and phone bar will show,
 * then carry straight on to the page that was asked for.
 */
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url), 307);
  response.headers.set("Cache-Control", "private, no-store");
  // Stops the proxy sending this browser here again even if there's no menu
  // to save (e.g. still finishing sign-up). A minute is plenty to stop a loop,
  // and short enough that signing out and back in gets the menu saved again.
  response.cookies.set(MENU_FILLED_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 });

  const user = await getOptionalUser().catch(() => null);
  if (!user) return response;

  const isAdmin = user.role === "ADMIN";
  const permissions = isAdmin ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;
  const progressEnabled = await getProgressEnabled();
  // Same call as SiteNav / SiteBottomNav, so the saved menu matches what they draw.
  const items = navItems(isAdmin, isAdmin ? "/admin/walks" : "/walks", permissions, progressEnabled).map(
    ({ href, label }) => ({ href, label }),
  );
  const initial = (user.firstName || user.email || "?").charAt(0);

  // Next encodes the value, giving the same format the browser writes
  // (encodeURIComponent'd JSON). Not httpOnly: the header script reads these
  // before the page loads.
  const options = { path: "/", sameSite: "lax" as const, maxAge: MONTH, httpOnly: false };
  response.cookies.set(NAV_COOKIE, JSON.stringify(items), options);
  response.cookies.set(BAR_COOKIE, JSON.stringify(items.slice(0, BOTTOM_BAR_TABS)), options);
  response.cookies.set(AVATAR_COOKIE, initial, options);
  return response;
}

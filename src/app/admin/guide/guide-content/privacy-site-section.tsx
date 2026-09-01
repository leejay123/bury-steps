import Link from "next/link";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody } from "./shared";

/** "Health notes and privacy" and "The public site". */
export function PrivacySiteSection() {
  return (
    <>
      <AccordionItem className="px-4 md:px-6" value="privacy">
        <AccordionTrigger className="text-base">Health notes and privacy</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              Health notes from the pre-walk check are only for organisers. Members never see each
              other’s notes or clock-out reasons.
            </p>
            <p>
              Those notes are deleted automatically <strong>90 days</strong> after the walk. The
              clock-in record itself stays. Read anything you need before you set off — there is a
              reminder on the walk page if anyone reported a condition.
            </p>
            <p>
              Names of people still clocked in are visible to others on that walk. Emails are
              not.
            </p>
            <p>
              First-time visitors also see a cookie notice. Accept or Decline is remembered for a
              year. There are no advertising cookies. Details are on the{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem className="px-4 md:px-6" value="site">
        <AccordionTrigger className="text-base">The public site</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              The homepage is cached so visitors get it quickly, without waiting on a sign-in
              check. Photos, quotes, FAQs, and the carousel switch update on the public site as
              soon as you save. If they do not, use{" "}
              <Link href="/admin/settings/cache">Site cache</Link> in Settings. The photo slider
              is not created on every visit. A <strong>Back to top</strong> button can be turned
              off in Display.
            </p>
            <p>
              First-time visitors see a cookie notice at the bottom of the screen, with Accept
              and Decline. Organisers choose the layout under{" "}
              <Link href="/admin/settings/display">Display</Link> (Default, Small, or Mini).
              Either choice is remembered for a year. The site does not use advertising cookies.
              Clerk still uses cookies that are needed to sign in. Vercel
              Analytics counts page views to show which pages are popular, without a cookie or a
              per-person ID, so it is not affected by Accept or Decline. The notice links to the{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>. The Facebook group link on the
              site is also set under Display.
            </p>
            <p>
              Pasting a link to the homepage or a walk (<code>/w/burrs-x7k2m9</code>) into WhatsApp,
              Messenger, or similar shows a preview card with the site name and, for a walk
              link, that walk’s own title and date. Opening the walk link without an account
              shows the meeting point on a map (and the postcode if the organiser added one), with
              Get directions into Google Maps or Apple Maps. The browser tab and bookmark icon
              use the same walking-boot mark. On a phone,
              “Add to Home Screen” (Safari) or “Install app”
              (Chrome) adds a Bury Steps icon that opens straight to Walks.
            </p>
            <p>
              Text, tables, and forms line up with the logo and nav. Photo and quote grids, and
              the edge-to-edge lines, still reach the side borders. Settings is a bordered list of
              rows, tap one to open that page — the same style as Walks, Members, and Accident
              reports. This Guide is full-width sections with a line between each. Privacy and
              Terms of Service use the same layout.
            </p>
            <p>
              Walk lists keep the title, date, and meeting point on one card so they fit a phone.
              Date and time sit on the same line. FAQ category chips on a phone scroll themselves
              so the one you tap stays in view. The menu under the logo does the same: tap a page
              and it slides into the middle.
            </p>
            <p>
              Members open Walks from the menu. Progress is next to it: this month’s clock-ins
              together, only for signed-in people. Each walk is a card with the date, length,
              meeting point, a truncated preview of the description, and a badge for its status —
              clock-in open, already clocked in, cancelled, or completed once the window has
              closed. Tapping anywhere on an open walk card
              opens that walk’s full page with the rest of the description and the full “Who’s
              coming” list (20 at a time if the walk is busy); the card itself only shows a one-line headcount. Cancelled cards stay on the list as a notice only — they do not
              open. The Clock in button
              works right there on the card without leaving the list, but Clock out is a
              deliberate step and only lives on the walk’s own page. A “Your recent walks”
              carousel underneath shows their last few — swipe or use the arrows to move between
              them, and “View all” opens their full History. Only walks that have actually
              finished (or been cancelled) show up there; a walk they’re still out on right now
              doesn’t count as history yet. History in the menu is every finished or cancelled
              walk they’ve clocked in to, grouped by year, with a search box plus filters for
              status and year. Tapping a finished walk opens it; a cancelled row in History is
              not a link. Previous and Next
              appear if they have more than 20 walks.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>
    </>
  );
}

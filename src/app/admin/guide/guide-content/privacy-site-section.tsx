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
              Health notes from the pre-walk check are only for site owners. Plain organisers
              and members never see each other’s notes. Clock-out reasons on the roster are
              visible to organisers with attendance access.
            </p>
            <p>
              The emergency contact (name and phone) is separate from health notes. Members
              enter it on the clock-in form. Organisers with attendance access see it when they
              open someone on the walk roster, and it is included on the roster download. Owners
              also see it on that person’s page in Members. Other members never see it. It stays
              on the account until the member changes it or the account is removed — it is not
              wiped after 90 days. Whether it is required is under Settings → Site behaviour →
              Clock-in. Off by default: the fields still show, and can be left blank.
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
              Members can turn on a phone alert for walks that are about to start. It sits under
              Phone in the email preferences drawer (the account menu) and on the Email
              preferences page. About an hour before a walk, anyone who turned it on gets a
              notification with the walk name and a link to clock in. On an iPhone the site has
              to be added to the Home Screen first. On Android or a computer, allowing
              notifications in the browser is enough. The switch shows this phone or computer
              only, so it can be off here while another device is still signed up. Turning it off
              removes that device. The
              keys that send the alerts live in the site&apos;s environment (VAPID_PUBLIC_KEY,
              VAPID_PRIVATE_KEY, and VAPID_SUBJECT). Without them, the switch explains that
              alerts are not set up yet. A job stays awake and looks about every 15
              minutes, so the alert goes out about an hour before the walk starts and
              not after it has started. A phone that failed, or was turned on during
              that hour, is included on the next look.
            </p>
            <p>
              The homepage is cached so visitors get it quickly, without waiting on a sign-in
              check. Photos, quotes, FAQs, and the carousel switch update on the public site as
              soon as you save. If they do not, use{" "}
              <Link href="/admin/settings/cache">Refresh the homepage</Link> in Settings. The photo slider
              is not created on every visit. A <strong>Back to top</strong> button can be turned
              off in <Link href="/admin/settings/behaviour">Site behaviour</Link>.
            </p>
            <p>
              First-time visitors see a cookie notice at the bottom of the screen, with Accept
              and Decline. Organisers choose the layout under{" "}
              <Link href="/admin/settings/behaviour">Site behaviour</Link> (Default, Small, or
              Mini). Either choice is remembered for a year. The site does not use advertising
              cookies. Clerk still uses cookies that are needed to sign in. Vercel
              Analytics counts page views to show which pages are popular, without a cookie or a
              per-person ID, so it is not affected by Accept or Decline. The notice links to the{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>. The Facebook group link on the
              site is also set under <Link href="/admin/settings/branding">Branding</Link>.
            </p>
            <p>
              Pasting a link to the homepage or a walk (<code>/w/burrs-x7k2m9</code>) into WhatsApp,
              Messenger, or similar shows a preview card with the site name and, for a walk
              link, that walk’s own title and date. Opening the walk link without an account
              shows the meeting point on a map (and the postcode if the organiser added one), with
              Get directions into Google Maps or Apple Maps. The browser tab and bookmark icon
              use the same walking-boot mark. On a phone,
              “Add to Home Screen” (Safari) or “Install app” / “Add to Home screen”
              (Chrome and other Android browsers) adds the full Bury Steps logo as the icon on
              iPhone and Android alike, and it opens straight to Walks. This home-screen icon is
              the built-in logo — uploading a new favicon under Branding changes the browser tab
              only. Anyone who saved the site before this was fixed and sees a plain “B” can
              remove the shortcut and add it again to pick up the logo.
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
              so the one you tap stays in view. On a phone, the menu icon (two lines) at the top left opens every page
              in a large list that starts right under the header, over a heavy blur of the page
              behind (no white tint), and the page behind stays still until you
              close it or pick a page. Signed-in people also get a <strong>search</strong> next to the
              bell (a search bar on a computer, a magnifying-glass icon on a phone or tablet, or
              ⌘K on a Mac / Ctrl+K elsewhere), that finds
              pages, walks, notices and FAQs — organisers also find the settings their permissions
              allow. It opens on the main pages; type to see up to five matches per section, split into
              upcoming and recent walks, notices, FAQs by category, and settings by area. Walks show
              just their name and are found by their name only — not by date, time or meeting point. Moving between pages, the new page fades in quickly (under a fifth of a second)
              while the header stays still — the old page stays up until the new one is ready, so
              there’s no white flash in between. <strong>Page transitions</strong> in Site behaviour
              switches this: Quick fade; Slide in and out of pages (opening
              something — a walk, a notice, a member, a settings page — the list slides away then
              the page slides in from the right as one piece, and back again — nothing inside it moves on its own;
              moving between main sections slides like tabs, following the order of the menu bar;
              pages opened from the phone menu just appear, since the menu closing is already the
              change; the homepage always just appears, with no slide or fade); Rise up, where each page rises gently into place like the walk cards; or No transition. On the Contact page only the contact card moves — its heading stays still. Tapping the phone bottom bar, the page slides in sideways towards the tab you tapped. With Slide, the next page starts loading the moment you
              tap, while the old one slides away, so it’s usually ready as soon as the slide ends. Pages you&apos;ve already opened in the last five minutes open instantly, and open pages update themselves within about half a minute when someone saves a change. Each time you open a page, the menu, tabs, search boxes, filters, headings and buttons are already there — including the category chips on Notices (All, Walks, and the rest). For anyone already signed in, the header (the page links, search, bell and avatar) and the homepage cards (See what&apos;s on, Track your progress, and the rest) are in place on the first paint, the same as last time. Every content card, such as the Progress totals, Together, and the monthly cup, fades in the same way as the Walks table: the card is already the right size, and the words and numbers inside show as grey for a moment, then fade in. A placeholder is never taller than the text it stands in for, so the page does not shrink when the words arrive. The number of grey rows matches the list — two reports show two rows, and an empty list shows none — so the page does not jump as it finishes loading. The typeface does not swap in after the page has painted. If a form shows an error, everything you typed stays in it. <strong>Phone menu</strong> in Site behaviour chooses how signed-in people get around on
              phones: the original ☰ menu (logo in the middle), or a <strong>bottom bar</strong> (logo on the
              left) with four main pages plus <strong>More</strong>, which slides up everything else. Signed-out visitors get their own bar — Home, Contact, the Facebook group
              and More — with Sign in and Join staying at the top. The bar steps aside
              while you type, so the keyboard doesn&apos;t push it over the form. Walk cards (Manage walks,
              and Upcoming and All walks on Walks) open with a thin header strip showing the status
              (Upcoming, Starting soon…) on the left and the day on the right, in the same plain grey as
              the Members list&apos;s group headings, with the
              time and meeting point underneath. The page you’re on is underlined, and a blue dot beside
              Notices means there’s one you haven’t read. The list is split under small labels:
              Menu for the main pages, Manage for the admin pages (owners and organisers only),
              Account for History and
              email preferences, and More for Contact us, the Facebook group, the Privacy Policy,
              and the Terms of Service. Visitors who aren’t signed in see Home, Sign in, Join the
              group, and the More links.
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

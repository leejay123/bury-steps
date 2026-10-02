import Link from "next/link";
import { HOMEPAGE_MEMBER_NOTICES_LIMIT } from "@/lib/homepage-copy";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Accident reports" and "Settings". */
export function ReportsDisplaySection() {
  return (
    <>
      <AccordionItem className="px-4 md:px-6" value="reports">
        <AccordionTrigger className="text-base">Accident reports</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              Open <Link href="/admin/reports">Reports</Link> in the top menu. Only organisers can
              see this. Add a report with the date, an optional walk, what happened, who was
              involved, what you did, and extra notes if you need them. Once there is more than one
              report, a search box appears above the list — it matches the linked walk, who was
              involved, and the write-up text, and stays on this page only (it is not put in the
              address bar). You can also filter by whether a walk is linked, and sort newest or
              oldest first. Each row shows the date, walk, and a short preview of what happened. Tap
              a row to read the full write-up. From there you can edit it or print a PDF. On a
              phone, print and remove sit on their own row under the text so the write-up is not
              squeezed. If there are more than 20 reports, Previous and Next at the bottom of the
              list take you through them.
            </p>
            <Steps>
              <li>Choose Add report (full width on a phone) and fill in the form. Save.</li>
              <li>
                Tap a row later to read it. Choose Edit if something needs changing, or Cancel to go
                back to the write-up. Remove is on the list under the text on a phone.
              </li>
              <li>
                Choose Print from the list or from the report. The PDF has the group logo, the date,
                the walk, who recorded it, and the full write-up. In the print dialog, turn off
                Headers and footers so the web address is not printed on the page.
              </li>
            </Steps>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem className="px-4 md:px-6" value="display">
        <AccordionTrigger className="text-base">Settings</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              The site uses a fixed black and white look. Remove and Cancel stay red. Other buttons
              stay white with a border. There is no colour picker. Everything below sits under{" "}
              <Link href="/admin/settings">Settings</Link>, split across a few pages.
            </p>
            <p>
              The Settings home is a table of every settings page, grouped by what it covers. Each
              row shows where that setting stands now (for example how many hero photos there are,
              or who gets contact-form messages). Anything unfinished or not set up — such as email
              sending, or no one receiving contact messages — is marked in amber on its row and
              listed together at the top. Type in the search box to find a setting by what&apos;s on
              it (&ldquo;logo&rdquo;, &ldquo;cookie&rdquo;, &ldquo;newsletter&rdquo;). Site wording
              opens in place to show its five pages. Reset the site sits on its own under{" "}
              <strong>Danger zone</strong>. Every settings page has an <strong>All settings</strong>{" "}
              link at the top to come back.
            </p>
            <p className="font-medium text-foreground">Branding</p>
            <p>
              Open <Link href="/admin/settings/branding">Branding</Link> to set the public{" "}
              <strong>site name</strong> and <strong>homepage tagline</strong> (also used in browser
              tabs and share previews), the <strong>site font</strong> (it changes the typeface
              across the whole website), <strong>text sizes</strong> (the homepage headline, section
              headings, intro lines, and everyday body text — set for computers, with phones getting
              smaller headings automatically), the logo and favicon, the accident-report banner, and the{" "}
              <strong>Facebook group</strong> link (leave blank to hide it).
            </p>
            <p className="font-medium text-foreground">Homepage layout</p>
            <p>
              Open <Link href="/admin/settings/homepage-layout">Homepage layout</Link> to set the{" "}
              <strong>homepage section order</strong> (blocks below the hero —{" "}
              <strong>Photo slider</strong>, <strong>How walks work</strong>,{" "}
              <strong>How this started</strong>, <strong>Latest notices</strong>,{" "}
              <strong>Testimonials</strong>, <strong>Apps for our walks</strong>,{" "}
              <strong>FAQs</strong>) and whether the{" "}
              <strong>photo slider</strong>, <strong>Animate section titles</strong> (section
              headings fade in word by word as you scroll) and{" "}
              <strong>Latest notices</strong> show. <strong>Background patterns</strong> sets a
              backdrop for each section: dot grid, grid lines, crosses, diagonal lines, or{" "}
              <strong>Stars</strong>, which drift slowly upwards, or <strong>Retro grid</strong>, a
              grid that scrolls slowly towards the horizon. <strong>Apps for our walks</strong>{" "}
              links to what3words (exact meeting points) and HiiKER (hiking maps) on the App
              Store and Google Play; it sits just above the FAQs to begin with.
            </p>
            <p>
              Signed-out visitors see <strong>How it works</strong> (jumps down to how the walks
              work) and <strong>Contact us</strong> in the hero, since Sign in and Join the group
              are already in the header; signed-in members see a button to their walks.{" "}
              <strong>Hero style</strong> on the same page picks the top of the homepage:{" "}
              <strong>Default</strong> (light hero), <strong>Video</strong> (full-bleed dark
              hero), <strong>Globe</strong> (live numbers beside a globe with moving lines; phones
              skip the globe), or{" "}
              <strong>Parallax</strong> (rows of photo cards that tilt and slide apart as you
              scroll), <strong>3D Marquee</strong> (a tilted wall of photos scrolling up and
              down behind the name), or <strong>Photo slider</strong> (your photos full width
              with the name and buttons on top; the separate Photo slider section then hides so
              the photos don&apos;t show twice). Four more photo heroes:{" "}
              <strong>Sideways strip</strong> (a row of tall photos that slides along as you scroll),{" "}
              <strong>Tiles fall into place</strong> (photos settle into a grid when the page opens),{" "}
              <strong>Diagonal rows</strong> (slanted rows sliding opposite ways behind the name) and{" "}
              <strong>Accordion panels</strong> (photo strips that open one at a time as you scroll,
              or when pointed at or tapped). They use Hero photos too, with samples filling any gaps.
              With Photo slider chosen, <strong>Words on the
              photo slider hero</strong> appears: the site name on every photo, each photo&apos;s
              own heading and text (set in Hero photos; blank photos show just the picture), or no
              words at all. The photo slider, the Parallax cards and the 3D Marquee all
              use the pictures from <strong>Homepage photos</strong>. Parallax needs 12 photos
              and 3D Marquee 15, so until there are enough they fill the gaps with sample walking
              photos; each photo you add replaces one. On Parallax, the photo&apos;s description
              is the caption on its card.
            </p>
            <p className="font-medium text-foreground">Site wording</p>
            <p>
              Open <Link href="/admin/settings/site-wording">Site wording</Link> to edit the{" "}
              <strong>How this started</strong> heading, blurb, and full story (the story opens in a
              drawer), the About drawer <strong>goals / places / expect / rules</strong> lists (each
              opens in a drawer), the <strong>Testimonials</strong> heading and intro, the{" "}
              <strong>FAQ</strong> heading and intro, and the walk-page cards (
              <strong>Before you set off</strong> and <strong>How this group works</strong> — edit
              the wording, or turn either card off). Signed-in members see
              up to {HOMEPAGE_MEMBER_NOTICES_LIMIT} of the newest notices in the{" "}
              <strong>Latest notices</strong> carousel (not the pinned welcome — that stays in the
              bell only; each card shows a short teaser). Tap a bell-only notice to open it in the
              bell drawer; tap a full-page notice to go to its page on <strong>Notices</strong>.
              Testimonials and FAQs still hide on the homepage until you add at least one quote or
              question. Hairlines sit between sections, not under the last block before the footer.
            </p>
            <p className="font-medium text-foreground">Site behaviour</p>
            <p>
              Open <Link href="/admin/settings/behaviour">Site behaviour</Link> to turn on the{" "}
              <strong>Announcement bar</strong> — a blue bar across the top of every page with your
              own message and an optional link (for example a changed meeting point). Choose where
              it shows: every page, the homepage only, public pages only, or pages you list (for
              example /walks, /notices). Visitors can
              close it, and it stays closed on their device for a day; new wording shows it to
              them again straight away. The same page sets how the
              cookie notice looks (<strong>Default</strong>, <strong>Small</strong>, or{" "}
              <strong>Mini</strong>), whether <strong>Back to top</strong> appears after you scroll,
              whether the big outlined name shows at the bottom of the homepage (and whether it also shows on phones),
              whether new organisers need an invite, and who gets emailed about contact form
              messages.
            </p>
            <p>
              Open <Link href="/admin/settings/cache">Refresh the homepage</Link> if the public
              homepage still shows old photos, quotes, FAQs, or notices after you saved. It
              refreshes the stored copy visitors are shown. It does not delete walks, members, or
              photos.
            </p>
            <p>
              Open <Link href="/admin/settings/reset">Reset the site</Link> to wipe walks,
              clock-ins, members, accident reports, notices, contact messages, newsletter
              subscribers, custom email wording, uploaded logo/favicon/report banner, the organiser
              sign-in log, and homepage edits, and put the starter photos, quotes, FAQs, all the
              site wording, and retention defaults back. The linked Resend newsletter audience is
              cleared so the next campaign does not reuse the old list. A box asks you to type{" "}
              <strong>delete</strong> before it runs. You stay signed in as the organiser, so a
              member who joins afterwards cannot take that role. Everyone else has to create an
              account again. This cannot be undone.
            </p>
            <p>
              Every newsletter has an unsubscribe link. It opens a page with an Unsubscribe button,
              so people who signed up in the footer can stop the emails without an account. Nothing
              changes until they press the button, because some email systems open links
              automatically to check them.
            </p>
            <p>
              <strong>Settings → Emails</strong> lists every email; tap one to edit its wording or send yourself a test in a drawer. Each has an on/off switch for
              every email the site sends (welcome, new walk, walk cancelled, new notice, monthly
              progress, contact alerts and so on). Only the owner can change them. An email that&apos;s
              off isn&apos;t sent to anyone until it&apos;s switched back on; &ldquo;Send test to me&rdquo; still
              works so you can check the wording first. Newsletters aren&apos;t affected.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>
    </>
  );
}

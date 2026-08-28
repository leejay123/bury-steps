import Link from "next/link";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS, MAX_FAQ_CATEGORIES } from "@/lib/faqs";
import { MAX_SITE_NOTICES } from "@/lib/notices";
import { FACEBOOK_GROUP_URL, PRODUCTION_APP_URL } from "@/lib/urls";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

/** Bump this whenever the guide is updated. */
export const GUIDE_LAST_UPDATED = "28 August 2026";

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-5 text-muted-foreground">{children}</ol>;
}

function GuideBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:mt-1.5 [&_ol]:flex [&_ol]:flex-col [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col">
      {children}
    </div>
  );
}

export function OrganiserGuide() {
  return (
    <Accordion className="w-full" collapsible defaultValue="what" type="single">
      <AccordionItem className="px-4 md:px-6" value="what">
          <AccordionTrigger className="text-base">What this site is for</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Bury Steps is a Sunday walking group around Bury and the surrounding countryside.
                This website is how the group runs walks: people join with an account, you publish
                the next walk, they clock in on the day, and you can see who turned up.
              </p>
              <p>
                The public homepage explains the group and points people to the{" "}
                <a href={FACEBOOK_GROUP_URL} rel="noopener noreferrer" target="_blank">
                  Facebook group
                </a>
                . Walks, clock-in, members, and the homepage content are managed here in Organiser
                tools.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="who">
          <AccordionTrigger className="text-base">Who can do what</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                <Badge variant="secondary">Visitors</Badge> can read the homepage, privacy and
                terms, and open a walk share link. They can search and filter FAQs by the
                categories you set. They cannot clock in until they have an account.
              </p>
              <p>
                <Badge variant="secondary">Members</Badge> see Walks and History in the menu. They
                get upcoming walks and cancelled walks from the last {CANCELLED_WALK_RETENTION_DAYS}{" "}
                days, clock in and out, see who else is still on a walk (names only), read notices
                in the bell, and look back over every walk they have clocked in to.
              </p>
              <p>
                <Badge>Organisers</Badge> also get Members, Reports, Settings, and this Guide in
                the top menu. You create walks, share the link, see the roster and any health notes,
                record accident reports, manage who is in the group, and edit the homepage.
              </p>
              <p>
                The first person to sign in becomes an organiser. Everyone after that is a member.
                There is no button to promote someone — that would need a change in the database.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="accounts">
          <AccordionTrigger className="text-base">Accounts and signing in</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Sign in and join happen on the account pages at accounts.burysteps-walkinggroup.co.uk.
                After signing in, members land on Walks. Organisers are sent to Walks in Organiser
                tools.                 Walks, Members, Reports, Settings, and this Guide stay in the top menu — there is no
                second row of tabs.
              </p>
              <p>
                Signed-in people can open their profile from the round button in the top-right
                (change name, email, or sign out).
              </p>
              <p>
                If someone opens a walk link while signed out, they are asked to create an account
                or sign in, then brought back to that same walk to clock in.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="walks">
          <AccordionTrigger className="text-base">Walks</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Open <Link href="/admin">Walks</Link> from the menu. Upcoming and History are tabs
                on that page. History is every finished walk, with a search box. Click a row to
                open the walk. History shows how many people clocked in, not how many are still on
                the walk. Long lists show 20 at a time, with Previous and Next at the bottom.
              </p>
              <p className="font-medium text-foreground">Create a walk</p>
              <Steps>
                <li>Fill in a title (for example “Burrs Country Park loop”).</li>
                <li>
                  Set the date and start time in <strong>UK time</strong>. Choose date and time
                  opens a compact calendar over the form: pick the day, then the hour and minute.
                  Length is the same kind of list, and defaults to 90 minutes.
                </li>
                <li>Add a meeting point and a short description if you want.</li>
                <li>Choose Create walk. A share link is generated automatically.</li>
              </Steps>
              <p className="font-medium text-foreground">Share the walk</p>
              <Steps>
                <li>Open the walk from the list.</li>
                <li>Copy the share link and post it in Facebook, or read the short code aloud.</li>
              </Steps>
              <p>
                Live share links always use {PRODUCTION_APP_URL}, even if you are looking at a
                preview of the site.
              </p>
              <p className="font-medium text-foreground">Cancel, reschedule, reopen, or remove</p>
              <ul className="list-disc pl-5">
                <li>
                  <strong>Cancel</strong> stops new clock-ins. People already on the list stay. You
                  can add a reason. Prefer this if you still want a record. Members still see
                  cancelled walks on their Walks page.
                </li>
                <li>
                  <strong>Reschedule</strong> changes the date, time, length, or meeting point with
                  the same calendar as Create walk. If the walk was cancelled, rescheduling also
                  puts it back on the diary.
                </li>
                <li>
                  <strong>Reopen</strong> undoes a cancel. Clock-in works again if the time window
                  is still open.
                </li>
                <li>
                  <strong>Remove</strong> deletes the walk and every clock-in on it. The share link
                  stops working. Use this only if you do not need the record. Remove is the small
                  button on the walk page.
                </li>
              </ul>
              <p>
                If a cancelled walk is not reopened, it is deleted automatically after{" "}
                <strong>{CANCELLED_WALK_RETENTION_DAYS} days</strong>.
              </p>
              <p>
                Open the walk from the list. The roster is names, status, and clock-in time. Tap a
                row for email, clock-out time, any clock-out reason, and health notes. If more than
                20 people clocked in, Previous and Next sit under the list.
              </p>
              <p>
                Download roster (CSV) gives you names, emails, times, clock-out reasons, and any
                health notes for that walk.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="clock-in">
          <AccordionTrigger className="text-base">Clock-in and clock-out</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Clock-in opens <strong>one hour before</strong> the start and closes{" "}
                <strong>one hour after</strong> the walk is due to finish. Example: a 2pm walk of 90
                minutes opens at 1pm and closes at 4:30pm, UK time.
              </p>
              <p>On the day, a member:</p>
              <Steps>
                <li>Opens the share link, or taps Clock in on their Walks page.</li>
                <li>Signs in if needed.</li>
                <li>
                  Completes the pre-walk check: they confirm they are fit to take part, and either
                  report no conditions or type a short note for organisers. ← Walks at the top takes
                  them back to their Walks page without clocking in.
                </li>
                <li>Clocks in. The time is recorded by the site, not their phone clock.</li>
              </Steps>
              <p>
                Members who leave early tap <strong>Clock out</strong> and must give a reason. You
                see that reason on the walk page. Other members only see that the person is no
                longer on the list — not why they left.
              </p>
              <p>
                Clock-in and clock-out are stored as two separate times. The member’s History page
                and the member history drawer both show the clock-out time when they have left, not
                the clock-in time again.
              </p>
              <p>
                After clocking out, they can clock in again on the same walk if the window is still
                open.
              </p>
              <p>
                If they try too early, the page says clock-in is not open yet. If the window has
                closed, they should speak to you.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="members">
          <AccordionTrigger className="text-base">Members</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Open <Link href="/admin/members">Members</Link> to see everyone who has signed up:
                name, email, whether they are an organiser or a member, when they joined, how long
                they have been a member, and how many clock-ins they have. The joined date is the day
                they first signed in. Search by name, email, or role. If there are more than 20
                people, Previous and Next at the bottom of the list take you through them.
              </p>
              <p className="font-medium text-foreground">Walk history</p>
              <p>
                Click a row to open a drawer with that person’s full walk history, grouped by year.
                Search if the list is long. Previous and Next appear if they have more than 20
                walks. Each walk shows the date, meeting point, and in/out times. Click a walk name
                to open that walk.
              </p>
              <p className="font-medium text-foreground">Remove someone</p>
              <Steps>
                <li>
                  Find them in the list and choose the small Remove button. You cannot remove
                  yourself.
                </li>
                <li>
                  Confirm. Their login is deleted, their clock-ins go, and any walks they created
                  are moved to you.
                </li>
              </Steps>
              <p>You cannot remove the last organiser, so the group is never left without one.</p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="homepage">
          <AccordionTrigger className="text-base">Homepage content</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                All of this lives under <Link href="/admin/settings">Settings</Link>. Hero photos,
                testimonials, FAQs, and notices use a list: tap a row to edit. Remove is the small
                button on the row, not in the drawer. Drawers are for adding and editing. On a
                phone the list stacks so you do not have to scroll sideways, Add buttons stretch
                full width, and drawers slide up from the bottom of the screen; on a wider screen
                they slide in from the side instead. A breadcrumb at the top of each settings page
                goes back to Settings — it greys when you hover it.
              </p>
              <p>
                Use the up and down arrows on the left of a row to change the order of photos,
                quotes, FAQ categories, and questions. Drop a photo onto the box in the drawer; it
                fills the width of the panel. Walks stay in date order, so those lists are not
                reordered.
              </p>
              <p className="font-medium text-foreground">Hero photos</p>
              <p>
                Up to {MAX_HOMEPAGE_SLIDES} photos in the carousel. JPEG, PNG, or WebP, up to
                4&nbsp;MB. Add a short description for each. With two or more, they rotate on their
                own.
              </p>
              <p>
                On <Link href="/admin/settings/hero-photos">Hero photos</Link> you can turn the
                carousel off completely. The homepage then skips the slider. Photos you have added
                stay here so you can switch it back on later.
              </p>
              <p className="font-medium text-foreground">Testimonials</p>
              <p>
                Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes. Name, a line under the name (for example
                “Member”), the quote, and an optional photo. The photo fills the drawer; use the
                cross on it to take the photo off before you save. Hidden on the homepage if you
                have none.
              </p>
              <p className="font-medium text-foreground">FAQs</p>
              <p>
                Up to {MAX_HOMEPAGE_FAQS} questions in up to {MAX_FAQ_CATEGORIES} categories. Open{" "}
                <Link href="/admin/settings/faqs">FAQs</Link>. Categories have their own list:
                tap a row to rename it in a drawer, or choose Add category to open the same
                drawer empty. Remove is on the list. You cannot remove a category that still has
                questions, or the last category.
              </p>
              <p>
                Click a question row to edit it in the drawer. Each question needs a category so
                visitors can filter on the homepage. Use the up and down arrows to change the order
                of categories or questions. Hidden if you have no questions.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="notices">
          <AccordionTrigger className="text-base">Notices</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Open <Link href="/admin/settings/notices">Notices</Link>. Up to {MAX_SITE_NOTICES}{" "}
                messages in the bell at the top of the site. Only signed-in people see them. The
                bell opens a drawer on phone and desktop — sliding up from the bottom on a phone,
                and in from the side on a wider screen.
              </p>
              <Steps>
                <li>Add a title and a message. On a phone, Add notice is full width.</li>
                <li>
                  Members get a red dot on the bell until they choose{" "}
                  <strong>Mark all as read</strong>. Opening the bell does not clear it on its own.
                </li>
              </Steps>
              <p>
                If you edit a notice, it shows as new again for everyone — the “already read” marks
                are cleared.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="reports">
          <AccordionTrigger className="text-base">Accident reports</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                Open <Link href="/admin/reports">Reports</Link> in the menu, or from Settings.
                Only organisers can see this. Add a report with the date, an optional walk, what
                happened, who was involved, what you did, and extra notes if you need them. Each
                row shows the date, walk, and a short preview of what happened. Tap a row to read
                the full write-up. From there you can edit it or print a PDF. On a phone, print
                and remove sit on their own row under the text so the write-up is not squeezed. If
                there are more than 20 reports, Previous and Next at the bottom of the list take you
                through them.
              </p>
              <Steps>
                <li>
                  Choose Add report (full width on a phone) and fill in the form. Save.
                </li>
                <li>
                  Tap a row later to read it. Choose Edit if something needs changing, or Cancel to
                  go back to the write-up. Remove is on the list under the text on a phone.
                </li>
                <li>
                  Choose Print from the list or from the report. The PDF has the group logo, the
                  date, the walk, who recorded it, and the full write-up. In the print dialog, turn
                  off Headers and footers so the web address is not printed on the page.
                </li>
              </Steps>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="display">
          <AccordionTrigger className="text-base">Display</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <p>
                The site uses a fixed black and white look. Remove and Cancel stay red. Other
                buttons stay white with a border. There is no colour picker.
              </p>
              <p>
                Open <Link href="/admin/settings/display">Display</Link> to turn the{" "}
                <strong>Back to top</strong> button off. When it is on, it appears after you scroll
                down, on the public site and in Organiser tools.
              </p>
              <p>
                Open <Link href="/admin/settings/cache">Site cache</Link> if the public homepage
                still shows old photos, quotes, or FAQs after you saved. Clear cache refreshes that
                stored copy. It does not delete walks, members, or photos.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

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
                and Decline. Either choice is remembered for a year. The site does not use
                advertising cookies. Clerk still uses cookies that are needed to sign in. The
                notice links to the{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>.
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
                Members open Walks from the menu. Each walk is a card with the date, length,
                meeting point, and a badge if clock-in is open, they are already in, or the walk is
                cancelled. Recent clock-ins are in a list underneath, with a short date. Tap a row
                to open that walk, then ← Walks to come back. History in the menu is every walk they
                have clocked in to, grouped by year, with a search box. Previous and Next appear if
                they have more than 20 walks.
              </p>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="px-4 md:px-6" value="limits">
          <AccordionTrigger className="text-base">Limits</AccordionTrigger>
          <AccordionContent>
            <GuideBody>
              <ul>
                <li>
                  <strong>Hero photos</strong> — {MAX_HOMEPAGE_SLIDES}
                </li>
                <li>
                  <strong>Testimonials</strong> — {MAX_HOMEPAGE_TESTIMONIALS}
                </li>
                <li>
                  <strong>FAQs</strong> — {MAX_HOMEPAGE_FAQS}
                </li>
                <li>
                  <strong>FAQ categories</strong> — {MAX_FAQ_CATEGORIES}
                </li>
                <li>
                  <strong>Notices</strong> — {MAX_SITE_NOTICES}
                </li>
                <li>
                  <strong>Photo uploads</strong> — 4 MB
                </li>
                <li>
                  <strong>Clock-in window</strong> — 1 hour before start, until 1 hour after the
                  walk should end
                </li>
                <li>
                  <strong>Health notes</strong> — kept for 90 days after the walk
                </li>
                <li>
                  <strong>Cancelled walks</strong> — shown to members, then deleted after{" "}
                  {CANCELLED_WALK_RETENTION_DAYS} days if not reopened
                </li>
              </ul>
            </GuideBody>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  );
}

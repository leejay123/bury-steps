import Link from "next/link";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS, MAX_FAQ_CATEGORIES } from "@/lib/faqs";
import { BELL_NOTICE_LIMIT, MAX_NOTICE_BELL_BODY, MAX_NOTICE_CATEGORIES, MAX_NOTICE_TEASER } from "@/lib/notices";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Homepage content" (hero photos, testimonials, FAQs) and "Notices". */
export function HomepageNoticesSection() {
  return (
    <>
      <AccordionItem className="px-4 md:px-6" value="homepage">
        <AccordionTrigger className="text-base">Homepage content</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              All of this lives under <Link href="/admin/settings">Settings</Link>. Hero photos,
              testimonials, FAQs, and notices use a list: tap a row to edit. Remove is the small
              button on the row, not in the drawer. Drawers are for adding and editing. On a
              phone, short lists (bell, About, Journey) still slide up from the bottom; long edit
              forms open as a near-full panel so the keyboard does not shove the sheet. Add
              buttons stretch full width. On a wider screen editors slide in from the side.
              While a drawer is open the page behind — including the site header — stays where it
              is, dimmed under a full-screen blur. A breadcrumb at the top of each settings page
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
              On <Link href="/admin/settings/hero-photos">Hero photos</Link> you add and reorder
              slides. Turn the carousel on or off under{" "}
              <Link href="/admin/settings/display">Display</Link> → Layout. When it is off, the
              homepage skips the slider. Photos you have added stay here so you can switch it back
              on later.
            </p>
            <p className="font-medium text-foreground">Testimonials</p>
            <p>
              Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes. Name, a line under the name (for example
              “Member”), the quote, and an optional photo. The photo fills the drawer; use the
              cross on it to take the photo off before you save. The section{" "}
              <strong>heading</strong> and <strong>intro</strong> are edited under{" "}
              <Link href="/admin/settings/display">Display</Link>. Hidden on the homepage if you
              have none.
            </p>
            <p className="font-medium text-foreground">FAQs</p>
            <p>
              Up to {MAX_HOMEPAGE_FAQS} questions in up to {MAX_FAQ_CATEGORIES} categories. Open{" "}
              <Link href="/admin/settings/faqs">FAQs</Link> to manage categories and questions.
              The section <strong>heading</strong> and <strong>intro</strong> are edited under{" "}
              <Link href="/admin/settings/display">Display</Link>. Categories have their own
              list: tap a row to rename it in a drawer, or choose Add category to open the same
              drawer empty. Remove is on the list. You cannot remove a category that still has
              questions, or the last category.
            </p>
            <p>
              Click a question row to edit it in the drawer. Each question needs a category so
              visitors can filter on the homepage. Use the up and down arrows to change the order
              of categories or questions. Hidden on the homepage if you have no questions yet.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem className="px-4 md:px-6" value="notices">
        <AccordionTrigger className="text-base">Notices</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              Open <Link href="/admin/settings/notices">Notices</Link>. You can add as many
              notices as you need. The member bell shows the pinned welcome (if it is on) plus the{" "}
              {BELL_NOTICE_LIMIT} newest other notices — older ones drop out of the bell only.
              Full-page notices stay on <Link href="/notices">Notices</Link> forever. Up to{" "}
              {MAX_NOTICE_CATEGORIES} categories for full-page notices. Notices are for signed-in
              members only — visitors do not see the bell or the Notices page. The drawer footer
              has <strong>Browse all notices</strong>.
            </p>
            <p className="font-medium text-foreground">Welcome (pinned)</p>
            <p>
              A welcome notice sits at the top of the bell for every member when it is on. Edit
              its title and message any time — use <code>{"{{firstName}}"}</code> to insert their
              name. Turn it off with the checkbox on its row if you want it hidden without
              deleting it. You cannot remove it or turn it into a full page. Saving it shows as
              updated again for everyone (badge says <strong>Updated</strong>, not New).
            </p>
            <p className="font-medium text-foreground">One-time Walks popup</p>
            <p>
              New members (no clock-ins yet) also see a one-time popup on Walks that explains find
              a walk, clock in, and clock out. Organisers never land on that page, so use{" "}
              <strong>Preview welcome dialog</strong> at the top of Notices settings to check it.
              The preview does not change whether a real member has already dismissed theirs.
            </p>
            <p className="font-medium text-foreground">Categories</p>
            <p>
              Categories only apply to full-page notices. Add, rename, reorder, or remove them at
              the top of the Notices settings page. Keep at least one. You cannot remove a category
              that still has notices — move or remove those first. On Notices, members filter with
              the same style of category chips as the homepage FAQs.
            </p>
            <p className="font-medium text-foreground">Bell only or full page</p>
            <Steps>
              <li>
                Choose <strong>Bell only</strong> for a short message that stays in the drawer, or{" "}
                <strong>Full page</strong> for a teaser in the bell plus a longer article on{" "}
                <Link href="/notices">Notices</Link>.
              </li>
              <li>
                Add a title and a short bell message (up to {MAX_NOTICE_BELL_BODY} characters —
                also the list excerpt for full-page notices). The welcome notice can be longer
                (up to {MAX_NOTICE_TEASER}). For a full page, pick a category and write the long
                text — that is what members see after <strong>Read full notice</strong>.
              </li>
              <li>
                Members see a count on the bell for unread notices and a <strong>New</strong>{" "}
                or <strong>Updated</strong> badge on each unread row (Updated after you edit a
                notice they had already seen). In the drawer, ordinary notices stay short; full-page
                teasers end with … and say <strong>Read full notice</strong>. Tapping a row marks
                that notice read. <strong>Mark all as read</strong> clears everything. Opening
                the bell does not clear them on its own.
              </li>
            </Steps>
            <p>
              On <Link href="/notices">Notices</Link>, members can search and filter by category.
              Each full-page notice is a simple list row (title, category, date, teaser),{" "}
              {LIST_PAGE_SIZE} at a time with Previous and Next when the list is long. Full-page
              links use a short random suffix (like walk share links), so the address cannot be
              guessed from the title alone. On Walks, members can
              also search upcoming walks by title or meeting point. If you edit a notice, it shows
              as updated again for everyone — the “already read” marks are cleared, and the badge
              says <strong>Updated</strong> instead of New.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>
    </>
  );
}

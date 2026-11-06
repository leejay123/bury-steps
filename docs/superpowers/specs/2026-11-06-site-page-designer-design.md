# Site page designer

Date: 2026-11-06

Organisers design six public site pages with the same Puck designer used on walk pages: edit wording, hide/show sections, reorder, then Publish. Not a freeform website builder.

## Goals

- One published design per page. Visitors, members, and organisers all see that design.
- Edit the wording of each page’s existing sections, hide sections, and reorder them.
- Quotes and FAQ answers are edited in the Home designer, not in separate Settings screens.
- Live data (upcoming walks, contact form) stays live. The designer controls heading, visibility, and order around those blocks.
- The designer opens only on a computer (1024px and wider), same as walk “Design this page”.

## Non-goals

- Freeform new block types (arbitrary extra headings/images/buttons beyond that page’s palette).
- Separate signed-in / signed-out / organiser layouts for these pages.
- Designing member pages (Walks, Notices, Progress, History) or walk share pages (`/w/…` already uses the walk designer).
- Redesigning sign-in / sign-up.
- Rebuilding the contact form or editing individual walks inside this designer.
- Removing the Homepage organiser permission from the product (it simply will not gate this designer).

## Where it lives

Settings → Homepage → **Page designs**.

Rows (and only these):

| Page    | URL                 |
| ------- | ------------------- |
| Home    | `/`                 |
| About   | `/about`            |
| Contact | `/contact`          |
| Privacy | `/privacy-policy`   |
| Terms   | `/terms-of-service` |
| Apps    | `/apps`             |

`/privacy` remains an alias of `/privacy-policy` and uses the same published design.

Opening a row on a **computer (min-width 1024px)** launches the walk-style Puck designer for that page.

On a phone or tablet: the list is visible; Open designer is hidden. The row states that these pages are designed on a computer. Puck must not load.

Permission: `permDisplay` (same as Branding). Walk page cards stay under Site wording for walk pages.

## Publish

- Each page has a **draft** and a **published** design.
- The public site reads **published** only.
- Until the first Publish for a page, visitors see today’s current implementation (seeded into the designer on first open, not a blank canvas).
- Closing the designer without Publish leaves the last published (or current) live page unchanged.
- Same Publish control pattern as the walk designer.

## Palettes (existing sections only)

You cannot add a kind of block the page does not already have. Remove a section to hide it; add it back from that page’s palette (at most one of each section type, except items inside Reviews and FAQs).

### Home

- **Hero** — wording editable. **Cannot be removed or hidden.** Stats (upcoming count, members, walks this year) stay automatic. Signed-in vs signed-out hero lines stay the small automatic swaps they are today.
- **About teaser** — title, teaser, Read more (still links to `/about`).
- **Upcoming walks** — title and intro editable; cards are live walks. Can hide or move.
- **What to expect** — heading and list items.
- **How walks work** — heading and steps.
- **Goals** — heading and list items.
- **Reviews** — heading/intro plus quotes (name, role, quote). Add/remove/reorder quotes here.
- **FAQs** — heading/intro, categories, questions and answers. Add/remove/reorder here.
- **Join CTA** — heading and supporting copy. Join/sign-in actions stay real auth links.

### About

Story; Goals (intro copy + list); Places (intro copy + list); What to expect (list); First step (including Facebook sentence when a group URL is set); Group rules (title + body per rule). Page title/lead/closing line are editable fields on the page (or the first/last blocks), not extra freeform blocks.

### Contact

- Heading and intro.
- Facebook button — show/hide; URL remains Settings → Branding.
- **Contact form — always on the published `/contact` page.** If it is missing from the canvas, Publish still includes it. Heading, intro, and the three form-step lines around the form are editable. Form fields and sending behaviour stay as they are.

### Privacy

Current sections, each heading + body: About this notice; Who we are; What we collect; Why we use it; Who else sees it; How long we keep it; Cookies; Your rights; Children.

Same hide/reorder/edit as About.

### Terms

Current sections, each heading + body: The group and the website; Your account; Safety on walks; Using the website; Privacy; Changes; Contact.

### Apps

Intro (eyebrow, title, blurb). One block each for what3words and HiiKER: name, tagline, description, “what it’s for” lines. Store links stay the current App Store / Google Play URLs (not redesigned in the canvas).

## Data

- Store draft + published JSON on `SiteSetting.sitePageDesigns`, same idea as `walkPageDesigns`: `{ home: { draft, published }, about: { … }, … }`. One source of truth.
- First open of a page copies current live copy and lists (including `HomepageTestimonial` / `HomepageFaq` rows and SiteSetting about/FAQ/testimonial heading fields) into the draft.
- After a page is published, that JSON is canonical for that page. Organisers do not edit the old columns/tables for that content anywhere else.

## Settings screens that go away

Remove these once the designer ships (redirect the old URLs to Page designs):

- Settings → Testimonials
- Settings → FAQs
- Site wording → How this started
- Site wording → About lists
- Site wording → Testimonials heading
- Site wording → FAQ heading

**Keep:**

- Branding (name, tagline, logo, favicon, Facebook URL, report banner)
- Site wording → Walk page cards
- All other Settings (Notices, Emails, Behaviour, etc.)

`permHomepage` stays in organiser permissions but does not open this designer.

## Live blocks

| Block           | In designer                         | Live behaviour                                      |
| --------------- | ----------------------------------- | --------------------------------------------------- |
| Upcoming walks  | Title, intro, show/hide, order      | Cards from real upcoming walks                      |
| Contact form    | Steps/copy around it; cannot hide   | Existing form + messages                            |
| Facebook        | Show/hide on About/Contact          | URL from Branding; hide if URL empty as today       |
| Hero stats      | Not typed                           | Counts from the database                            |
| Join / sign in  | CTA copy                            | Real join/sign-in routes                            |

## Out of scope pages

Walks list, Notices, Progress, History, Overview, onboarding, admin, sign-in, walk share pages.

## Testing (acceptance)

- Display organiser on a computer can open each of the six pages, edit copy, reorder, hide a hideable section, Publish, and see it on the public URL.
- Without Publish, the public URL is unchanged.
- Phone/tablet: list visible, designer does not open.
- Home hero cannot be removed; published Home always includes it.
- Published Contact always includes the form.
- Upcoming walk cards still match real walks after retitling/moving the section.
- Old Testimonials / FAQs / Site wording routes (except Walk page cards) no longer offer a separate editor.
- `/privacy` and `/privacy-policy` show the same published Privacy design.
- Organiser without Display cannot open Page designs.

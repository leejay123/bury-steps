import Link from "next/link";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { MAX_SITE_NOTICES } from "@/lib/notices";
import { FACEBOOK_GROUP_URL, PRODUCTION_APP_URL } from "@/lib/urls";
import { THEME_PRESETS } from "@/lib/theme";

/** Bump this whenever the guide is updated. */
export const GUIDE_LAST_UPDATED = "26 August 2026";

const SECTIONS = [
  { id: "what", title: "What this site is for" },
  { id: "who", title: "Who can do what" },
  { id: "accounts", title: "Accounts and signing in" },
  { id: "walks", title: "Walks" },
  { id: "clock-in", title: "Clock-in and clock-out" },
  { id: "members", title: "Members" },
  { id: "homepage", title: "Homepage content" },
  { id: "notices", title: "Notices" },
  { id: "colour", title: "Site colour" },
  { id: "privacy", title: "Health notes and privacy" },
  { id: "limits", title: "Limits" },
] as const;

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">{children}</ol>;
}

function GuideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" id={id}>
      <h2 className="text-base font-semibold tracking-tight">
        <a className="hover:underline" href={`#${id}`}>
          {title}
        </a>
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

export function OrganiserGuide() {
  return (
    <article className="flex max-w-3xl flex-col gap-10">
      <nav aria-label="On this page">
        <p className="mb-2 text-sm font-medium text-foreground">On this page</p>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a className="hover:text-foreground hover:underline" href={`#${section.id}`}>
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <GuideSection id="what" title="What this site is for">
        <p>
          Bury Steps is a Sunday walking group around Bury and the surrounding countryside. This
          website is how the group runs walks: people join with an account, you publish the next
          walk, they clock in on the day, and you can see who turned up.
        </p>
        <p>
          The public homepage explains the group and points people to the{" "}
          <a href={FACEBOOK_GROUP_URL} rel="noopener noreferrer" target="_blank">
            Facebook group
          </a>
          . Walks, clock-in, members, and the homepage content are managed here in Organiser tools.
        </p>
      </GuideSection>

      <GuideSection id="who" title="Who can do what">
        <p>
          <strong>Visitors</strong> can read the homepage, privacy and terms, and open a walk share
          link. They cannot clock in until they have an account.
        </p>
        <p>
          <strong>Members</strong> see Walks in the menu. They get upcoming walks, clock in and out,
          see who else is still on a walk (names only), and read notices in the bell.
        </p>
        <p>
          <strong>Organisers</strong> (you) also get Members and Settings. You create walks, share
          the link, see the roster and any health notes, manage who is in the group, and edit the
          homepage.
        </p>
        <p>
          The first person to sign in becomes an organiser. Everyone after that is a member. There
          is no button to promote someone — that would need a change in the database.
        </p>
      </GuideSection>

      <GuideSection id="accounts" title="Accounts and signing in">
        <p>
          Sign in and join happen on the account pages at accounts.burysteps-walkinggroup.co.uk.
          After signing in, members land on Walks. Organisers are sent to Organiser tools.
        </p>
        <p>
          Signed-in people can open their profile from the round button in the top-right (change
          name, email, or sign out).
        </p>
        <p>
          If someone opens a walk link while signed out, they are asked to create an account or sign
          in, then brought back to that same walk to clock in.
        </p>
      </GuideSection>

      <GuideSection id="walks" title="Walks">
        <p>
          Open <Link href="/admin">Walks</Link>. Upcoming walks are on one tab, recent past walks on
          the other. Click a row to open the walk.
        </p>
        <p className="font-medium text-foreground">Create a walk</p>
        <Steps>
          <li>Fill in a title (for example “Burrs Country Park loop”).</li>
          <li>
            Set the date and start time in <strong>UK time</strong>. Length defaults to 90 minutes.
          </li>
          <li>Add a meeting point and a short description if you want.</li>
          <li>Choose Create walk. A share link is generated automatically.</li>
        </Steps>
        <p className="font-medium text-foreground">Share the walk</p>
        <Steps>
          <li>Open the walk from the table.</li>
          <li>Copy the share link and post it in Facebook, or read the short code aloud.</li>
        </Steps>
        <p>
          Live share links always use {PRODUCTION_APP_URL}, even if you are looking at a preview of
          the site.
        </p>
        <p className="font-medium text-foreground">Cancel, reopen, or remove</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Cancel</strong> stops new clock-ins. People already on the list stay. You can
            add a reason. Prefer this if you still want a record.
          </li>
          <li>
            <strong>Reopen</strong> undoes a cancel. Clock-in works again if the time window is
            still open.
          </li>
          <li>
            <strong>Remove</strong> deletes the walk and every clock-in on it. The share link stops
            working. Use this only if you do not need the record.
          </li>
        </ul>
        <p>
          Download roster (CSV) gives you names, emails, times, clock-out reasons, and any health
          notes for that walk.
        </p>
      </GuideSection>

      <GuideSection id="clock-in" title="Clock-in and clock-out">
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
            Completes the pre-walk check: they confirm they are fit to take part, and either report
            no conditions or type a short note for organisers.
          </li>
          <li>Clocks in. The time is recorded by the site, not their phone clock.</li>
        </Steps>
        <p>
          Members who leave early tap <strong>Clock out</strong> and must give a reason. You see
          that reason on the walk page. Other members only see that the person is no longer on the
          list — not why they left.
        </p>
        <p>
          After clocking out, they can clock in again on the same walk if the window is still open.
        </p>
        <p>
          If they try too early, the page says clock-in is not open yet. If the window has closed,
          they should speak to you.
        </p>
      </GuideSection>

      <GuideSection id="members" title="Members">
        <p>
          Open <Link href="/admin/members">Members</Link> to see everyone who has signed up: name,
          email, whether they are an organiser or a member, when they joined, and how many clock-ins
          they have.
        </p>
        <p className="font-medium text-foreground">Remove someone</p>
        <Steps>
          <li>Find them in the table and choose Remove. You cannot remove yourself.</li>
          <li>
            Confirm. Their login is deleted, their clock-ins go, and any walks they created are
            moved to you.
          </li>
        </Steps>
        <p>You cannot remove the last organiser, so the group is never left without one.</p>
      </GuideSection>

      <GuideSection id="homepage" title="Homepage content">
        <p>
          All of this lives under <Link href="/admin/settings">Settings</Link>. Hero photos,
          testimonials, FAQs, and notices use a table: click a row to edit. Remove is on the table,
          not in the drawer. Drawers are for adding and editing.
        </p>
        <p className="font-medium text-foreground">Hero photos</p>
        <p>
          Up to {MAX_HOMEPAGE_SLIDES} photos in the carousel. JPEG, PNG, or WebP, up to 4&nbsp;MB.
          Add a short description for each. With two or more, they rotate on their own. Move up and
          down in the edit drawer to change the order.
        </p>
        <p className="font-medium text-foreground">Testimonials</p>
        <p>
          Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes. Name, a line under the name (for example
          “Member”), the quote, and an optional photo. Hidden on the homepage if you have none.
        </p>
        <p className="font-medium text-foreground">FAQs</p>
        <p>
          Up to {MAX_HOMEPAGE_FAQS} questions. Click a row to edit in the drawer. Each has a
          category: Joining, Walks, On the day, or Your account. Move up and down in the edit drawer
          to change the order. Visitors can search and filter them. Hidden if you have none.
        </p>
      </GuideSection>

      <GuideSection id="notices" title="Notices">
        <p>
          Open <Link href="/admin/settings/notices">Notices</Link>. Up to {MAX_SITE_NOTICES} messages
          in the bell at the top of the site. Only signed-in people see them.
        </p>
        <Steps>
          <li>Add a title and a message.</li>
          <li>Members get a red dot on the bell until they open it.</li>
        </Steps>
        <p>
          If you edit a notice, it shows as new again for everyone — the “already read” marks are
          cleared.
        </p>
      </GuideSection>

      <GuideSection id="colour" title="Site colour">
        <p>
          Open <Link href="/admin/settings/appearance">Site colour</Link>. This is the colour used
          for buttons, links, and highlights. Forest green is the original.
        </p>
        <p>
          Pick a preset (
          {THEME_PRESETS.map((preset) => preset.name.toLowerCase()).join(", ")}) or use the picker /
          hex field. The rest of the palette (borders, muted backgrounds, text) follows the colour
          you choose. Save to apply it for everyone.
        </p>
      </GuideSection>

      <GuideSection id="privacy" title="Health notes and privacy">
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
          Names of people still clocked in are visible to others on that walk. Emails are not.
        </p>
      </GuideSection>

      <GuideSection id="limits" title="Limits">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Hero photos: {MAX_HOMEPAGE_SLIDES}</li>
          <li>Testimonials: {MAX_HOMEPAGE_TESTIMONIALS}</li>
          <li>FAQs: {MAX_HOMEPAGE_FAQS}</li>
          <li>Notices: {MAX_SITE_NOTICES}</li>
          <li>Photo uploads: 4&nbsp;MB</li>
          <li>Clock-in window: 1 hour before start, until 1 hour after the walk should end</li>
          <li>Health notes kept for 90 days after the walk</li>
        </ul>
      </GuideSection>
    </article>
  );
}

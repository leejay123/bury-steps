import Link from "next/link";
import { PRODUCTION_APP_URL } from "@/lib/urls";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Walks" — creating, sharing, editing, attendance, and Journey. */
export function WalksSection() {
  return (
    <AccordionItem className="px-4 md:px-6" value="walks">
      <AccordionTrigger className="text-base">Walks</AccordionTrigger>
      <AccordionContent>
        <GuideBody>
          <p>
            Open <Link href="/admin">Walks</Link> from the menu. Upcoming and History are tabs
            on that page. A walk stays under Upcoming until its clock-in window has fully
            closed — including long walks that finish more than three hours after start —
            then it moves to History. History is every finished walk. Both tabs have a search
            box, a <strong>Status</strong> filter (for example Upcoming, In progress,
            Cancelled, or Completed on History), and a <strong>Sort</strong> control (soonest
            first or latest first). Click a row to open the walk. History shows how many people
            clocked in, not how many are still on the walk. Long lists show 20 at a time, with
            Previous and Next at the bottom. Each row carries a status that updates as the day
            goes on: <strong>Upcoming</strong> (before clock-in opens),{" "}
            <strong>Starting soon</strong> (the hour before start — the badge shows a live
            countdown to the published start), <strong>In progress</strong> (until the
            scheduled end), <strong>Completed</strong> (from the scheduled end — self clock-in
            is closed), or <strong>Cancelled</strong>. The walk’s own page shows the same
            status next to its title.
          </p>
          <p className="font-medium text-foreground">Create a walk</p>
          <Steps>
            <li>Fill in a title (for example “Burrs Country Park loop”).</li>
            <li>
              Set the date and start time in <strong>UK time</strong>. Choose date and time
              opens a compact calendar over the form: pick the day, then the hour and minute.
              Length is the same kind of list, and defaults to 90 minutes.
            </li>
            <li>
              Add a meeting point if you can — a short label people will recognise (for example
              “Visitor centre, Burrs”). Optionally add a UK postcode, then tap{" "}
              <strong>Find this place</strong>. Pick the right match from the list. That sets
              the map pin. The wording you typed is what members still see, and changing it
              afterwards does not move the pin. Find this place looks up the postcode on its
              own — putting the postcode and the street into one search finds nothing. If you
              skip Find this place, the site looks the postcode or meeting point up when you
              save. If nothing matches, people still get directions from the text, just without
              a pin. The map uses free OpenStreetMap — no extra account is needed.
            </li>
            <li>Add a short description if you want.</li>
            <li>
              Choose Create walk. The start must still be in the future — you cannot create a
              1pm walk at 7pm the same day. A short share link is generated from the first word
              of the title plus a random code, for example <code>/w/burrs-x7k2m9</code>. That
              keeps links readable without being guessable from the place name alone.
            </li>
          </Steps>
          <p className="font-medium text-foreground">Share the walk</p>
          <Steps>
            <li>Open the walk from the list.</li>
            <li>
              Copy the share link and post it in Facebook. It is meant to stay short and
              readable. Older links that look like a code still work — they open the same walk.
            </li>
            <li>
              Someone who is not signed in sees a prompt to create an account or sign in first
              while the walk is still open, then the date, time, length, meeting point (and
              postcode if you added one), a map with Get directions, what to bring, and how the
              group works. Once the walk is Completed, guests see that it has finished instead —
              no join prompt. Names of who is on the walk stay private.
            </li>
          </Steps>
          <p>
            Live share links always use {PRODUCTION_APP_URL}, even if you are looking at a
            preview of the site.
          </p>
          <p>
            You can publish more than one walk in a week. Each walk has its own day, time,
            meeting point, and share link. Members see every upcoming walk on their Walks page.
          </p>
          <p className="font-medium text-foreground">Cancel, edit, reopen, duplicate, or remove</p>
          <ul className="list-disc pl-5">
            <li>
              <strong>Cancel</strong> stops new clock-ins. People already on the list stay. You
              can add a reason. Prefer this if you still want a record. Members still see
              cancelled walks on their Walks page as a notice, but they cannot open the walk
              page or add it to a calendar. Organisers open cancelled walks from Admin → Walks
              (or the share link while signed in as an organiser).
            </li>
            <li>
              <strong>Edit</strong> changes the title, date, time, length, meeting point, or
              description — the same fields as Create walk, including Find this place. Use this
              when the meeting point moves, or when Sunday becomes Wednesday. People already
              clocked in stay on the walk. If you change the title, copy the share
              link again — it uses the new name. Changing the date does not change the link.
              Links you already posted still work
              and send people to the updated page. If the walk was
              cancelled, saving also puts it back on the diary. The walk’s own organiser page
              shows the same map members see on the share link. Once the published start time
              has passed, date, time, and length freeze — changing them would rewrite the
              record under people already walking. Title, meeting point, and notes stay
              editable until the walk is Completed. Self clock-in stops at the scheduled end; if
              someone was there but missed it, use Add someone.
            </li>
            <li>
              <strong>Reopen</strong> undoes a cancel without changing the details. Clock-in
              works again if the time window is still open.
            </li>
            <li>
              <strong>Duplicate</strong> makes a new walk with the same title, meeting point,
              length, and notes, starting one week later at the same time. Attendance and
              journey notes stay on the original. You land on the new walk so you can check the
              date before sharing.
            </li>
            <li>
              <strong>Remove</strong> deletes the walk and every clock-in on it. The share link
              stops working. Use this only if you do not need the record. Remove walk is the
              red button on the walk page.
            </li>
          </ul>
          <p>
            On the walk page and on the public share link, <strong>Add to calendar</strong>{" "}
            downloads a small calendar file (.ics) so phones and calendar apps can save the
            date, time, meeting point, and a link back to the walk. Cancelled and completed
            walks do not offer Add to calendar — for members or organisers — and the calendar
            file link returns not found.
          </p>
          <p>
            Once a walk reaches <strong>Completed</strong>, Cancel and Edit disappear from its
            page — it already happened, so there is nothing left to cancel or change. Remove,
            Duplicate, and the CSV export are still there if you need them.{" "}
            <strong>Add someone</strong> stays, so you can still put a forgotten clock-in on
            the list.
          </p>
          <p>
            If a cancelled walk is not reopened, it is deleted automatically after{" "}
            <strong>{CANCELLED_WALK_RETENTION_DAYS} days</strong>.
          </p>
          <p>
            Open the walk from the list. <strong>Attendance</strong> is names and clock-in time
            for whoever is on the walk right now. Anyone who has clocked out moves down into
            its own <strong>Clocked out</strong> list below — so the count always matches the
            rows under it — with the same details available. Once the walk reaches Completed,
            the first list relabels itself to <strong>Attended</strong>: everyone still in it
            stayed for the whole walk without clocking out, so “on the walk” would be wrong
            once it’s over — and clocking out itself stops being offered to members from then
            on, since there is nothing left to leave early from. Tap a row for email,
            clock-out time, any clock-out reason, and health notes.{" "}
            <strong>Remove</strong> sits on each list row (same as Journey and reports) when
            the walk is not cancelled — it asks you to confirm. If more than 20
            people clocked in, Previous and Next sit under either list.
          </p>
          <p>
            <strong>Journey</strong> is the story of the walk — short timed events (a cafe stop,
            a viewpoint) with an optional note. It sits at the bottom of the organiser walk
            page. Add events once the walk has started, including after Completed. Tap a row to
            edit; <strong>Remove</strong> on the list asks you to confirm, same as notices and
            reports. Use <strong>View journey</strong> to open the animated timeline in a
            drawer — members get the same button at the top of the walk link. Up to 20 events.
            A cancelled walk keeps what you already wrote, but you cannot add more.
          </p>
          <p>
            <strong>Add someone</strong> on that attendance section is for a member who was
            there but did not clock in — phone died, they forgot, or the window had already
            closed. They must already have an account; you cannot add someone who has never
            signed up. While the walk is still open, they are clocked in at the time you add
            them — including someone who already clocked out and came back. After Completed,
            they show as attending from the start, with no health notes, and anyone already
            on the roster cannot be added again. Reopen a cancelled walk first if you need
            to add someone to it. Search by name or email — the list shows up to 40 matches
            so it stays quick even with thousands of members.
          </p>
          <p>
            To take someone off the roster, use <strong>Remove</strong> on their row. That
            deletes their clock-in for this walk (from the roster and from their history for
            this walk). Use it for a mistaken add or if they were never there. Reopen a
            cancelled walk first if you need to remove someone from it.
          </p>
          <p>
            Walks titled <strong>[Demo]</strong> are sample rows so you can check Previous and
            Next on a long list. Search Demo on Walks → History. A few also have sample{" "}
            <strong>Journey</strong> events so you can see the timeline. The same Demo prefix is
            on sample accident reports. Remove them with{" "}
            <Link href="/admin/settings/reset">Settings → Reset the site</Link>, or delete
            those rows one by one.
          </p>
          <p>
            Download roster (CSV) gives you names, emails, times, clock-out reasons, and any
            health notes for that walk. On a phone, the action buttons under the map (roster,
            calendar, Duplicate, Cancel, Edit, Remove) scroll sideways in one row.
          </p>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

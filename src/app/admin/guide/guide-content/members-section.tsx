import Link from "next/link";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Members" — the list, walk history, promote/demote, and remove. */
export function MembersSection() {
  return (
    <AccordionItem className="px-4 md:px-6" value="members">
      <AccordionTrigger className="text-base">Members</AccordionTrigger>
      <AccordionContent>
        <GuideBody>
          <p>
            Open <Link href="/admin/members">Members</Link> to see everyone who has signed up:
            name, email, whether they are an organiser or a member, when they joined, how long
            they have been a member, and how many clock-ins they have. The joined date is the day
            they first signed in. Filter by role (All, Organisers, or Members), sort the list
            (newest or oldest first, name, or most clock-ins), and search by name, email, or
            role. Search stays on this page only — it is not put in the address bar. If there
            are more than 20 people, Previous and Next at the bottom of the list take you through
            them.
          </p>
          <p>
            <strong>Needs attention</strong> narrows the list to the two things most worth a
            look: a member who has never clocked in, and an organiser invite that has expired.
            Either is also marked with a small warning icon next to their name even with the
            filter off, so they still stand out while browsing the full list.
          </p>
          <p className="font-medium text-foreground">Walk history</p>
          <p>
            Click a row to open that person’s own page: joined date, membership length, quick
            totals (total walks and walks cancelled after they clocked in — plus walks
            created, but only for organisers, since members never create walks), and their full
            walk history below, grouped by year. Search by walk or meeting point, and filter by
            status (stayed for the walk, left early, or cancelled) or year if the list is long.
            Previous and Next appear if they have more than 20 walks. Each walk shows the date,
            meeting point, and in/out times — including whether they stayed for the whole walk.
            Click a walk name to open that walk. This is a full page rather than a drawer, so it
            stays readable even for someone who has been on hundreds of walks.
          </p>
          <p className="font-medium text-foreground">Make organiser or member</p>
          <p>
            Only the site&rsquo;s one owner can promote a member, demote an organiser, edit an
            organiser&rsquo;s permissions, or remove an organiser&rsquo;s account — see
            &ldquo;The owner&rdquo; below. Everyone else with the Members permission can still
            view and search this list, and remove a plain member&rsquo;s account.
          </p>
          <Steps>
            <li>
              Open the person on <Link href="/admin/members">Members</Link>, or use the button
              on their row in the list.
            </li>
            <li>
              Choose <strong>Make organiser</strong> and pick what they can do — you do not have
              to give them everything. <strong>Make member</strong> takes organiser tools away
              entirely. Their account, clock-ins, and walk history stay either way.
            </li>
            <li>
              Type <strong>&ldquo;Confirm&rdquo;</strong> in the box, then confirm again. That
              stops an accidental click from changing someone’s access.
            </li>
          </Steps>
          <p>You cannot demote the last organiser, so the group is never left without one.</p>
          <p className="font-medium text-foreground">Remove someone</p>
          <Steps>
            <li>
              Choose the small Remove button, either on the Members list or on the member’s own
              page. On a phone, role and Remove sit under the name so the email is not squeezed.
              You cannot remove yourself.
            </li>
            <li>
              Type <strong>&ldquo;Confirm&rdquo;</strong> in the box, then choose{" "}
              <strong>Remove member</strong>. Their login is deleted, their clock-ins go, and
              any walks, accident reports, or Journey beats they created are moved to you.
            </li>
          </Steps>
          <p>You cannot remove the last organiser, so the group is never left without one.</p>
          <p className="font-medium text-foreground">The owner</p>
          <p>
            The site has exactly one owner — the &ldquo;master organiser&rdquo; — shown with an
            Owner badge instead of Organiser. Only the owner can promote or demote an organiser,
            edit an organiser&rsquo;s permissions, or remove an organiser&rsquo;s account. The
            owner always has full access and cannot demote or remove themselves — choose{" "}
            <strong>Make owner</strong> on another organiser&rsquo;s row to hand the role over
            first. That organiser gains full access; you keep whatever permissions you already
            had, just without the owner-only powers. Because this is such a big change, it asks
            you to type that organiser&rsquo;s own name to confirm, rather than just the word
            &ldquo;Confirm&rdquo; used elsewhere.
          </p>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

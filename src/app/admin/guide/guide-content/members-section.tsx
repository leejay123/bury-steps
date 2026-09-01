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
            they first signed in. Filter by role (All, Organisers, or Members), and search by
            name, email, or role. Search stays on this page only — it is not put in the address
            bar. If there are more than 20 people, Previous and Next at the
            bottom of the list take you through them.
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
          <Steps>
            <li>
              Open the person on <Link href="/admin/members">Members</Link>, or use the button
              on their row in the list.
            </li>
            <li>
              Choose <strong>Make organiser</strong> to give them organiser tools (walks,
              Members, Reports, Settings, and this Guide), or <strong>Make member</strong> to
              take those tools away. Their account, clock-ins, and walk history stay.
            </li>
            <li>
              Type <strong>&ldquo;Confirm&rdquo;</strong> in the box, then confirm again. That
              stops an accidental click from changing someone’s access.
            </li>
          </Steps>
          <p>
            You cannot demote the last organiser, so the group is never left without one. You
            can demote yourself if another organiser is still in the group.
          </p>
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
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

import Link from "next/link";
import { FACEBOOK_GROUP_URL } from "@/lib/urls";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { GuideBody } from "./shared";

/** "What this site is for", "Who can do what", "Accounts and signing in". */
export function OverviewSection() {
  return (
    <>
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
              categories you set. They cannot clock in or see notices until they have an account.
            </p>
            <p>
              <Badge variant="secondary">Members</Badge> see Walks, Progress, and History in the
              menu. They get upcoming walks and cancelled walks from the last {CANCELLED_WALK_RETENTION_DAYS}{" "}
              days, can search Walks by title or meeting point, clock in and out, see who else is
              still on a walk (names only), read notices in the bell (including a pinned welcome),
              look back over every walk they have clocked in to, and see Progress — this month’s
              clock-ins together, not a race.
            </p>
            <p>
              <Badge>Organisers</Badge> also get Members, Reports, Settings, and this Guide in
              the top menu, plus the same Progress page members see. You create walks, share the
              link, see the roster and any health notes, record accident reports, manage who is
              in the group, edit the homepage, and optionally set a monthly together goal.
            </p>
            <p>
              The first person to sign in becomes an organiser. Everyone after that is a member.
              You can promote a member to organiser, or demote an organiser back to member, from{" "}
              <Link href="/admin/members">Members</Link>.
            </p>
            <p>
              Organiser pages look the same as a missing link to everyone else. A member or
              visitor who opens <code>/admin</code> sees the 404 page, not a message that those
              tools exist. Only a signed-in organiser can use them.
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
    </>
  );
}

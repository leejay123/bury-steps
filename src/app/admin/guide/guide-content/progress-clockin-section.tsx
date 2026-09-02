import Link from "next/link";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Progress" and "Clock-in and clock-out". */
export function ProgressClockInSection() {
  return (
    <>
      <AccordionItem className="px-4 md:px-6" value="progress">
        <AccordionTrigger className="text-base">Progress</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              Open <Link href="/progress">Progress</Link> from the menu. Every signed-in
              member and organiser can see it. Visitors cannot. It is not on the public homepage.
            </p>
            <p>
              This is how the group walks together — clock-ins, not miles or speed. There are no
              winners and no losers. People who have not clocked in this month are not listed, so
              nobody is shown as a zero.
            </p>
            <p>
              Each person sees their own month, year, and streak (consecutive UK weeks with at
              least one finished walk). A week with no completed group walk does not break a
              streak. Badges mark first walk, 5 / 10 / 25 walks, staying for a whole walk, every
              walk in a month (when that month had at least two), a streak of two weeks or more,
              and a comeback after missing three or more weeks that did have walks.
            </p>
            <p>
              This month’s cup goes to whoever has the most finished clock-ins this UK month. It
              resets next month. A tie is shared. First names only — if two people share a first
              name, a last initial is added. The month list groups people by walk count (for
              example “5 walks”, then “3 walks”) so a draw sits together — there are no 1st / 2nd
              places.
            </p>
            <p>
              Optionally set a monthly together goal under{" "}
              <Link href="/admin/settings/progress">Settings → Progress</Link>. That is a group
              target, not a personal one. Leave it blank if you do not want one. Save to keep the
              number; Discard goes back to what is stored.
            </p>
            <p>
              If more than 20 people clocked in this month, Previous and Next sit under the list.
              The same 20-at-a-time paging is used on a walk’s “Who’s coming” list and on
              organiser attendance — so a walk with a thousand clock-ins stays usable.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem className="px-4 md:px-6" value="clock-in">
        <AccordionTrigger className="text-base">Clock-in and clock-out</AccordionTrigger>
        <AccordionContent>
          <GuideBody>
            <p>
              Clock-in opens <strong>one hour before</strong> the start and closes at the{" "}
              <strong>scheduled end</strong> (start time plus the expected length). Example: a
              2pm walk of 90 minutes opens at 1pm and closes at 3:30pm, UK time. After that, only
              an organiser can add someone who was there.
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
              longer on the list — not why they left. Clock out is only offered while the walk
              is still open — once it reaches Completed there is nothing left to leave early
              from, so a member who stayed clocked in the whole time just sees “You attended this
              walk”, with no button.
            </p>
            <p>
              Clock-in and clock-out are stored as two separate times. The member’s History page
              and their walk history on their own member page in Members both show the clock-out
              time when they have left, not the clock-in time again. A member who never clocked
              out shows as “Still on the walk” while it’s open, and “Stayed for the whole walk”
              once it’s Completed.
            </p>
            <p>
              After clocking out, they can clock in again on the same walk if the window is still
              open.
            </p>
            <p>
              If they try too early, the page says when clock-in opens and shows a short “Before
              you set off” checklist so the wait isn’t just a blank screen. If the window has
              closed, they should speak to you. Open the walk and use <strong>Add someone</strong>{" "}
              — you do not need to change the date or time. They must already have an account.
              If they never signed up, they need to create one first; you cannot clock in a
              person who is not on Members.
            </p>
            <p>
              The first time a member reaches their Walks page before they have been on any
              walk, they see a short pop-up walking through these steps. It only shows once —
              after their first walk, or once they dismiss it, it does not come back.
            </p>
          </GuideBody>
        </AccordionContent>
      </AccordionItem>
    </>
  );
}

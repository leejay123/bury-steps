import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS, MAX_FAQ_CATEGORIES } from "@/lib/faqs";
import { BELL_NOTICE_LIMIT, MAX_NOTICE_BELL_BODY, MAX_NOTICE_CATEGORIES, MAX_NOTICE_TEASER } from "@/lib/notices";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { MAX_MONTHLY_CLOCK_IN_GOAL } from "@/lib/walk-game";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody } from "./shared";

/** "Limits" — a quick-reference list of every numeric cap in the app. */
export function LimitsSection() {
  return (
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
              <strong>Notices in the bell</strong> — welcome (optional) + {BELL_NOTICE_LIMIT}{" "}
              newest
            </li>
            <li>
              <strong>Bell / teaser message</strong> — {MAX_NOTICE_BELL_BODY} characters
              (welcome up to {MAX_NOTICE_TEASER})
            </li>
            <li>
              <strong>Notice categories</strong> — {MAX_NOTICE_CATEGORIES}
            </li>
            <li>
              <strong>Together goal</strong> — optional, up to {MAX_MONTHLY_CLOCK_IN_GOAL}{" "}
              clock-ins this month
            </li>
            <li>
              <strong>Photo uploads</strong> — 4 MB
            </li>
            <li>
              <strong>Clock-in window</strong> — 1 hour before start, until the walk’s
              scheduled end
            </li>
            <li>
              <strong>Health notes</strong> — kept for 90 days after the walk
            </li>
            <li>
              <strong>Cancelled walks</strong> — shown to members as a notice (not openable),
              then deleted after {CANCELLED_WALK_RETENTION_DAYS} days if not reopened
            </li>
          </ul>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

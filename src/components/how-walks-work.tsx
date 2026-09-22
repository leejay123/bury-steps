import { CalendarDays, Footprints, MapPin, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_HOW_WALKS_WORK_STEPS, type AboutRule } from "@/lib/homepage-copy";

/** Cycled by position — an admin can add or remove steps, but there's
 * nowhere to store a custom icon per step, so this just keeps assigning a
 * reasonable one in order. */
const STEP_ICONS = [UserPlus, CalendarDays, Footprints, MapPin];

export function HowWalksWork({
  steps = DEFAULT_HOW_WALKS_WORK_STEPS,
}: {
  /** Editable in Settings → Display → Homepage copy — see @/lib/homepage-copy. */
  steps?: readonly AboutRule[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How this group works</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index % STEP_ICONS.length];
            return (
              <li className="flex gap-3" key={`${index}-${step.title}`}>
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

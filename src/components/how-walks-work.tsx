import { CalendarDays, Footprints, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create an account",
    body: "Sign up with email or Google so we know who is on the walk.",
  },
  {
    icon: CalendarDays,
    title: "Come to the meeting point",
    body: "The time and place are on this page. Walks are self-paced — come as you are.",
  },
  {
    icon: Footprints,
    title: "Clock in when you arrive",
    body: "That is how the walk leader knows you are there. You will do that after you sign in.",
  },
];

export function HowWalksWork() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How this group works</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {STEPS.map((step) => (
            <li className="flex gap-3" key={step.title}>
              <step.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

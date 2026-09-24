import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_BEFORE_YOU_SET_OFF_TIPS } from "@/lib/homepage-copy";

export function BeforeYouSetOff({
  tips = DEFAULT_BEFORE_YOU_SET_OFF_TIPS,
}: {
  /** Editable in Settings → Site wording → Walk page cards — see @/lib/homepage-copy. */
  tips?: readonly string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Before you set off</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

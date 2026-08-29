import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIPS = [
  "Wear comfortable shoes and dress for the weather.",
  "Bring a bottle of water — snacks too, for longer walks.",
  "Aim to arrive at the meeting point a few minutes early.",
  "New to the group? Say hello when you arrive — everyone was new once.",
];

export function BeforeYouSetOff() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Before you set off</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

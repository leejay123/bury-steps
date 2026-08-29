import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeoPoint } from "@/lib/geocode";
import { appleMapsUrl, googleDirectionsUrl, osmEmbedUrl, osmViewUrl } from "@/lib/maps";

export function WalkMap({
  location,
  point,
}: {
  location: string;
  point: GeoPoint | null;
}) {
  return (
    <Card className="gap-4 overflow-hidden py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-base">Meeting point</CardTitle>
        <CardDescription>{location}</CardDescription>
      </CardHeader>
      {point ? (
        <div className="border-y bg-muted">
          <iframe
            className="block h-64 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={osmEmbedUrl(point)}
            title={`Map of ${location}`}
          />
        </div>
      ) : null}
      <CardContent className="flex flex-col gap-3 px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={googleDirectionsUrl(location, point)} rel="noopener noreferrer" target="_blank">
              Get directions
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={appleMapsUrl(location, point)} rel="noopener noreferrer" target="_blank">
              Apple Maps
            </a>
          </Button>
        </div>
        {point ? (
          <p className="text-xs text-muted-foreground">
            Map data from{" "}
            <a
              className="underline-offset-4 hover:underline"
              href={osmViewUrl(point)}
              rel="noopener noreferrer"
              target="_blank"
            >
              OpenStreetMap
            </a>
            , free to use. Directions open Google or Apple Maps on your phone.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Get directions opens Google or Apple Maps with this meeting point. A map pin appears
            here when the place can be found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

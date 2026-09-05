import Link from "next/link";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Walking routes". */
export function RoutesSection() {
  return (
    <AccordionItem className="px-4 md:px-6" value="routes">
      <AccordionTrigger className="text-base">Walking routes</AccordionTrigger>
      <AccordionContent>
        <GuideBody>
          <p>
            A route is the path you walk, shown on a map. You add it once from a GPX file and can
            then use it on as many walks as you like — most groups walk the same handful of paths
            over and over, so this is a small job you only do a few times. Members see the route
            on the walk page with roughly how far it is.
          </p>
          <p>
            Open <Link href="/admin/routes">Routes</Link> in the menu, then choose{" "}
            <strong>New route</strong>.
          </p>
          <Steps>
            <li>
              Give it a name you will recognise later, like &ldquo;Burrs Country Park loop&rdquo;.
              Add a note if there is something worth saying, like a steep bit or a gate.
            </li>
            <li>
              Choose <strong>Import a GPX file</strong> — a file exported from Strava, OS Maps,
              Komoot, a GPS watch, or a route planner like plotaroute.com or
              openrouteservice&apos;s own map. There is no drawing a route by hand; every route
              starts life as a file like this. See below for where to find one if you do not
              already have it.
            </li>
            <li>
              The line, distance, and (if the file has it) elevation gain/loss appear
              automatically. A recorded trace already has far more points than anyone would click
              by hand, so it comes out accurate straight away. If the file is unusually detailed
              it gets thinned to fit, without changing the shape or the distance in any way that
              matters.
            </li>
            <li>
              Not sure where you are on the map while checking it over? Start typing a place name,
              postcode, or full address (e.g. &ldquo;12 Fenwick Drive, Bury&rdquo;) into the search
              box — suggestions appear as you type, and picking one (or pressing{" "}
              <strong>Find</strong>) jumps the map there and drops a marker. Standing on the actual
              path? <strong>Use my location</strong> jumps straight to wherever you are right now
              instead. Neither one changes the route — they only move the view.
            </li>
            <li>Save.</li>
          </Steps>
          <p>
            <strong>Where to find a GPX file for a walk around Bury.</strong> If you have already
            walked the route with a phone or watch, export it from whatever recorded it (Strava,
            OS Maps, Komoot, and most GPS watches all have a &ldquo;Export GPX&rdquo; option on the
            recorded activity). Otherwise, sites like Wikiloc and plotaroute.com have GPX downloads
            for existing local trails you can search by area — or plot a new one yourself in
            openrouteservice&apos;s own map and export that. Either way, once one walk is saved as
            a route here it is reusable forever, so it is worth saving the route the first time
            your group actually walks it.
          </p>
          <p>
            <strong>Fine-tuning after import.</strong> The start (green dot) and finish (red dot)
            can be dragged to nudge them — handy since a GPS trace often starts a few metres from
            the actual meeting point. Click any blue dot along the way to remove it, useful for a
            stray glitch point. <strong>Start again</strong> clears the route so you can import a
            different file instead.
          </p>
          <p>
            <strong>Putting a route on a walk.</strong> Open the walk from the walks list, find
            Walking route, pick one from the dropdown and save. Choose &ldquo;No route&rdquo; to
            take it off again. A walk without a route works exactly as it always did — nothing
            appears where the map would be.
          </p>
          <p>
            <strong>Deleting a route.</strong> Any walks using it keep everything: the date, the
            details, who clocked in. They simply stop showing a map. The confirmation tells you how
            many walks are affected before you go ahead.
          </p>
          <p>
            The distance comes from the imported file, so treat it as roughly right rather than
            exact — different recordings of the same path can differ slightly. It is a guide for
            members deciding whether a walk suits them, not a precise measurement.
          </p>
          <p>
            <strong>Snap to real footpaths.</strong> If a &ldquo;Snap to real footpaths&rdquo;
            checkbox appears above the map, a maintainer has switched on path-matching. A GPX
            import always turns it off itself, since a real recorded trace is already the true
            path and needs no correcting. It mainly matters if you drag the start or finish dot of
            an older, hand-drawn route far from where it was — tick it to have that edit snap back
            onto the real path network. No checkbox means it isn&apos;t set up yet.
          </p>
          <p>
            <strong>Elevation and distance.</strong> If the imported file has an elevation
            profile, the up-hill and down-hill totals show on the walk page alongside the
            distance. If it does not, no elevation shows — nothing is guessed.
          </p>
          <p>
            <strong>Difficulty.</strong> Set from the Difficulty dropdown when you save a route —
            nothing in a drawn line or an imported file can tell you how hard a walk actually is
            for this group, so it&apos;s always your call, not a computed rating. It shows as a
            badge on the walk page alongside the distance. Leave it as &ldquo;Not set&rdquo; to
            show nothing.
          </p>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

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
            A route is the path you walk, drawn on a map. You draw it once and can then use it on
            as many walks as you like — most groups walk the same handful of paths over and over,
            so this is a small job you only do a few times. Members see the route on the walk
            page with roughly how far it is.
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
              Not sure where you are on the map? Start typing a place name, postcode, or full
              address (e.g. &ldquo;12 Fenwick Drive, Bury&rdquo;) into the search box above it —
              suggestions appear as you type, and picking one (or pressing <strong>Find</strong>)
              jumps the map there and drops a marker so you know exactly where &ldquo;here&rdquo;
              is. Standing on the actual path? <strong>Use my location</strong> jumps straight to
              wherever you are right now instead. Neither one draws anything — they only move the
              view.
            </li>
            <li>
              Click the map where the walk starts. A green dot appears.
            </li>
            <li>
              Keep clicking along the path. <strong>Follow the bends.</strong> The line runs
              straight between your clicks, so if you only click at each end of a curvy path the
              distance will come out shorter than the real walk. The more you click, the closer it
              gets.
            </li>
            <li>
              The distance updates as you go, along with a rough idea of how long the walk takes.
            </li>
            <li>Save.</li>
          </Steps>
          <p>
            <strong>Fixing mistakes.</strong> Undo last point removes the most recent click. Start
            again clears the lot. You can drag the green start dot or the red finish dot to move
            them. To remove a point in the middle without undoing everything after it, just click
            that blue dot.
          </p>
          <p>
            <strong>Doing this on a laptop is much easier than on a phone.</strong> The map is
            bigger and clicking is far more accurate.
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
            The distance is worked out from where you clicked, so treat it as roughly right rather
            than exact. It is a guide for members deciding whether a walk suits them, not a
            measurement.
          </p>
          <p>
            <strong>Snap to real footpaths.</strong> If a &ldquo;Snap to real footpaths&rdquo;
            checkbox appears above the map, a maintainer has switched on path-matching: on save,
            your clicked points are matched onto the real network of paths and the distance is
            recalculated from that, so you need far fewer clicks — just the start, a couple of
            waypoints, and the finish. Untick it to save the line exactly as you drew it instead.
            No checkbox means it isn&apos;t set up yet; nothing about drawing changes either way.
          </p>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

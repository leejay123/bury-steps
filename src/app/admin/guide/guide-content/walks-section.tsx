import Link from "next/link";
import { PRODUCTION_APP_URL } from "@/lib/urls";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GuideBody, Steps } from "./shared";

/** "Walks" — creating, sharing, editing, attendance, and Journey. */
export function WalksSection({
  cancelledWalkRetentionDays,
}: {
  cancelledWalkRetentionDays: number | null;
}) {
  return (
    <AccordionItem className="px-4 md:px-6" value="walks">
      <AccordionTrigger className="text-base">Walks</AccordionTrigger>
      <AccordionContent>
        <GuideBody>
          <p>
            Open <Link href="/admin/walks">Walks</Link> from the menu. Upcoming
            and History are tabs on that page. A walk stays under Upcoming until
            its clock-in window has fully closed — including long walks that
            finish more than three hours after start — then it moves to History.
            History is every finished walk. Both tabs have a search box, a{" "}
            <strong>Status</strong> filter (for example Upcoming, In progress,
            Cancelled, or Completed on History), and a <strong>Sort</strong>{" "}
            control (soonest first or latest first). Those choices stay in the
            address, so a refresh or the back button keeps them, and you can
            copy the link. The member Walks page does the same. Click a row to
            open the walk. History shows how many people clocked in, not how
            many are still on the walk. Long lists show 20 at a time, with
            Previous and Next at the bottom. Each row carries a status that
            updates as the day goes on: <strong>Upcoming</strong> (before
            clock-in opens), <strong>Starting soon</strong> (the hour before
            start — the badge shows a live countdown to the published start),{" "}
            <strong>In progress</strong> (until the scheduled end),{" "}
            <strong>Completed</strong> (from the scheduled end — self clock-in
            is closed), or <strong>Cancelled</strong>. While a walk is{" "}
            <strong>Starting soon</strong> or <strong>In progress</strong>, the
            row also says <strong>Clock in now</strong> until you have clocked
            in, then <strong>You’re clocked in</strong>. Open the walk and use
            the same pre-walk check members use — fit to take part, conditions,
            and emergency contact. Before it opens, a blue{" "}
            <strong>Clock-in is not open yet</strong> box on the walk’s page
            says when it will (the same box members see). You are then on that
            walk’s attendance list once you clock in. You don’t need to clock in
            to see who’s coming: on a walk’s shared page, organisers and owners
            always see <strong>Who’s coming</strong> (or{" "}
            <strong>Who attended</strong> afterwards), while members only see
            the names once they’ve clocked in themselves. The walk’s own page
            shows the same status just under its title, then the date, start
            time, length, and meeting point on their own lines. Who created the
            walk sits under the title.
          </p>
          <p className="font-medium text-foreground">Create a walk</p>
          <Steps>
            <li>
              Choose <strong>Create a walk</strong> above the list — it opens a
              panel with the form. Fill in a title (for example “Burrs Country
              Park loop”).
            </li>
            <li>
              Set the date and start time in <strong>UK time</strong>. Choose
              date and time opens a compact calendar over the form: pick the
              day, then the hour and minute. Length is the same kind of list,
              and defaults to 90 minutes.
            </li>
            <li>
              Add a meeting point if you can — a short label people will
              recognise (for example “Visitor centre, Burrs”). Optionally add a
              UK postcode, then tap <strong>Find this place</strong>. Pick the
              right match from the list. That sets the map pin. The wording you
              typed is what members still see, and changing it afterwards does
              not move the pin. Find this place looks up the postcode on its own
              — putting the postcode and the street into one search finds
              nothing. If you skip Find this place, the site looks the postcode
              or meeting point up when you save. If nothing matches, people
              still get directions from the text, just without a pin. The map
              uses free OpenStreetMap — no extra account is needed.
            </li>
            <li>
              Under <strong>Details</strong>, fill in what you know:{" "}
              <strong>Distance</strong> (for example “8.8 km (5.5 miles)”),{" "}
              <strong>Elevation gain</strong> (for example “213 m”), grade, walk
              leader and back marker, and any <strong>Refreshment stop</strong> (for example Hare &amp; Hounds, Bolton Road, Abbey Village). Tick any <strong>Essentials</strong> —
              toilets, parking, café, dog friendly, step-free, near public
              transport, boots recommended, stiles. Each shows on the walk page
              as its own line or tag, so the description can stay for the story
              of the walk. To rename these, change their icons, reorder them,
              add your own or remove ones you don&apos;t use, go to{" "}
              <strong>Settings → Walk essentials</strong> (anyone allowed to
              edit walks can open it, even without other settings); changes show
              on every walk straight away.
            </li>
            <li>
              Most walks need nothing more for the location. For a what3words
              address or exact map coordinates, open{" "}
              <strong>More location options</strong> under the postcode. It
              opens by itself when you edit a walk that already has a what3words
              address.
            </li>
            <li>Add a short description if you want.</li>
            <li>
              Choose Create walk. The start must still be in the future — you
              cannot create a 1pm walk at 7pm the same day. A short share link
              is generated from the first word of the title plus a random code,
              for example <code>/w/burrs-x7k2m9</code>. That keeps links
              readable without being guessable from the place name alone.
            </li>
          </Steps>
          <p className="font-medium text-foreground">Share the walk</p>
          <Steps>
            <li>Open the walk from the list.</li>
            <li>
              Copy the share link and post it in Facebook. It is meant to stay
              short and readable. Older links that look like a code still work —
              they open the same walk.
            </li>
            <li>
              Someone who is not signed in sees a prompt to create an account or
              sign in first while the walk is still open, then the date, time,
              length, meeting point (and postcode if you added one). A long
              description collapses to a few lines with{" "}
              <strong>Read more</strong> (only when the text is actually cut off), which opens the whole description at
              the same text size. Under the walk details is{" "}
              <strong>How this group works</strong>, then the shared sections:
              Before you set off (everyone — visitors, members, organisers
              and owners — sees it until the walk finishes), the meeting point map, the 7-day forecast and the precise
              location. Their order, and whether the map, forecast and precise
              location show at all, is set under Settings → Site wording → Walk
              page cards → <strong>Walk page layout</strong> (arrows to move,
              switches to show or hide), and applies to members&apos;,
              organisers&apos; and owners&apos; walk pages alike. The two
              cards&apos; wording is edited, or turned off, on the same page. At
              the top of that page, <strong>Layout</strong> chooses how every
              walk&apos;s page is laid out, the same for members and organisers:{" "}
              <strong>One column</strong> (the original, everything stacked) or{" "}
              <strong>Two columns with tabs</strong>. With two columns, a
              computer shows the walk&apos;s details on the left with tabs under
              them (Map &amp; weather, Attended and Journey for organisers; Map
              &amp; weather, and Journey once it has moments, for members), and
              a right-hand column that stays in view as you scroll: clock-in,
              the share link and the walk&apos;s buttons for organisers;
              clock-in, How this group works and Before you set off for members.
              On a phone it is one column: the details, then that right-hand
              column, then the tabs. Four more are one column with tabs
              (Overview, Map &amp; weather, Attended for organisers, and
              Journey): <strong>A</strong> puts a row of actions (clock-in, Copy
              share link and the walk&apos;s buttons) under the title;{" "}
              <strong>B</strong> keeps the tab bar, with Copy share link and
              Clock in at its end, at the top of the screen as you scroll;{" "}
              <strong>C</strong> starts with a coloured box saying what&apos;s
              happening now (for example Clock-in open, starts at 13:45, 3
              clocked in) with the main buttons; <strong>D</strong> has a Manage
              walk button by the title for the walk&apos;s buttons, and Overview
              shows summary boxes (Attended, Meeting point, Weather, Journey)
              that each open their tab. A to D also come with a header style, in
              the same list: H1, the controls beside the name; H2, a bar of
              controls above a big name and four key facts; H3, a box with a
              coloured status band and one Manage button; or H4, the controls in
              two boxes, You and Organise this walk. The list also has 21 more
              designs to try, numbered 1 to 21 (Minimal document to Spec sheet,
              then Countdown ring and Split header), then 22 to 51, grouped by
              look — polished app (Trail card, Activity, Listing with booking
              card…), clean and minimal (Properties panel, Docs with contents,
              Type first…), bold outdoors (Trailhead sign, Poster, Status
              takeover…) and organiser dashboard (Control room, Phases board,
              Cockpit…) — each with the same parts arranged differently, and
              then 52 to 81, the <strong>Details first</strong> designs: any
              messages (such as Clock-in opens at 09:15…) come first, then one
              card holding everything about the walk — name, status, date, start
              and finish, length, meeting point, what3words, distance, climb,
              grade, walk leader, back marker, refreshment stop, essentials and the description —
              some with the map built into the card, some running the full width
              of the page, some with a sidebar (on a phone it opens from a
              button). You can also design the walk page yourself: on any
              organiser walk page, <strong>Design this page</strong> in the Manage list (owners and
              organisers with the Display permission) opens the walk page
              designer over that walk. Drag blocks in from the left — Messages,
              Title, Details card, Facts, Essentials, Clock in + Manage, Status,
              Map, Weather, Attended, Journey, How this group works (for
              signed-out visitors), story cards, a bento grid, a walk ticket
              (plain or colour), a Before · During · After phases board, colour
              blocks, round badges and more, plus layout blocks such as Tabs
              (which can stay at the top as you scroll and scroll sideways on a
              phone), Columns, Sidebar (opens from a button on a phone), Section
              (with a background and space inside), Card and Folding sections — and pick
              each block&apos;s look on the right; the looks are the ones from
              the designs below. Make one design each for organisers, members
              and signed-out visitors, or start from a ready-made one, and press
              Publish to save it. Walk pages use them when Layout is set to{" "}
              <strong>Designed</strong>. Saving a design only refreshes walk
              pages. Every block also has Block layout: a frame (card, light grey, outline, dark or
              green), an optional heading, and whether it shows on phones,
              computers or both. Blocks with several items (Facts, story
              cards, summary tiles, colour blocks, round badges) can fill the
              width or stay on one row that swipes sideways. Clock in and
              Manage can go together or as separate Clock in button and Manage
              button blocks, and the walk name, status badge, countdown, the
              day&apos;s timeline and any one fact are blocks of their own. Block layout&apos;s Buttons option makes the
              block&apos;s buttons full width on phones, or everywhere. The Map block
              has looks (card, flat, map only, details floating over the map,
              details beside the map), a height, and Directions buttons below,
              above, on the map or hidden — or add the Directions buttons block
              to place them anywhere else. The Tabs block (under Layout) has a Style — the site&apos;s
              tab style from Settings, grey pill, sliding underline or pills
              that drop in — and tab widths that share the full width, fit the
              names from the left, or fit them centred; drop any blocks into
              each tab. In the designer every tab&apos;s area, and every folding
              section, is shown open so blocks can be dropped into each; the
              page itself shows one tab at a time. Block layout also has
              Shadows (keep or remove), and the Details card&apos;s map has its
              own directions-buttons and height options. The preview shows
              exactly what the chosen audience would see — Signed-out visitors
              includes How this group works — whoever is signed in. Facts (in its own block or in the Details card) can look and
              be arranged differently on phones — for example one swiping row
              on a phone and a grid on a computer — with looks including two
              columns, a list, a table, chips and tiles. Messages have looks (soft,
              bold, compact, a coloured stripe, or hidden), and Block layout
              can restyle the messages and boxes inside any block. New
              signed-out visitor designs start with How this group works. The Details card&apos;s map can also hide its Meeting point
              title and its small print, as the Map block can. The Tabs block&apos;s
              tabs can be square, rounded or fully rounded. On the page, a tab with nothing in it for whoever is
              looking (Attended for a member, for example) is left out of the
              tab bar. Columns are equal heights by default (the last block in
              each column stretches; or choose As tall as their content), and
              any one column can stay in view as you scroll on a computer. The Back link block (← All walks for organisers, ← Walks for
              members, ← Home for visitors) can be moved, removed, reworded
              and given a look: plain text, an outline, ghost or solid button,
              a grey pill or a round arrow button, with an arrow, a chevron
              or neither, left, centre, right or full width. A design without
              it has no back link (the ready-made designs start with one). Facts can have their own
              look and arrangement on phones (under 768 pixels wide), tablets
              (768 to 1023) and computers, and Block layout&apos;s Show on
              includes tablets. Essentials have looks too (outline pills, grey chips, a
              list, a tick list, tiles, one line, just the words, icons in grey
              circles, big icons, small outlined cards, rows with lines between,
              or one box split into sections), with their own choice on
              phones, tablets and computers, and the heading on or off — the
              heading looks like the Description&apos;s. Set Arrange to One row,
              swipe sideways or Carousel with ‹ › buttons when there are lots. Before
              you set off can be the card, a tick list, numbered steps, a green
              callout, numbered tiles, swiping tiles or one short paragraph.
              Fill the width now stretches a short last row so there are no
              gaps; Even grid keeps the columns lined up. Spacing: the Tabs
              block sets the space between the tabs and their content and
              between blocks in a tab, Columns the space between columns, and
              Block layout the space above and below any block. The precise location (what3words) can go in the Details
              card — above or below the facts, above, on or below the map, or
              at the bottom — or with the Map block, as the full card, a
              compact one-line chip or a plain text link. Start from a ready-made design now also lists a ready-made
              page for every numbered design (1 to 81): each is the Back link
              and that design whole, in a Ready-made layout block you can add
              blocks around or switch to another design. The Tabs block has
              tab looks from free component libraries (folder tabs, coloured
              folder tabs, soft or solid pills, a bordered box, light, outline
              pills, joined segments, a line on top, or plain words) and can
              put the tab names down the left side on a computer. The Details
              card&apos;s status (Upcoming · Clock-in opens…) can be the badge
              and words, the badge or words only, a coloured pill or hidden,
              above or below the walk name; its map sits inside the card, lined up with its words; Space inside sets its
              padding (none by default when it has no frame, so it lines up
              with the page like the Notices heading). Directions buttons have
              looks (solid and outline, both outline, both solid, ghost,
              rounded pills, with map icons, text links, stacked). In the
              designer, a walk with no messages right now shows a sample
              message, marked Preview only, where messages would go. Block layout&apos;s Space above has Right under the header,
              for a first block that sits straight under the site header with
              no gap — for example a Messages block. Maps can have
              square, rounded or very rounded corners. A Messages block with no messages shows nothing at all. Nothing on a designed page runs edge to edge: every block sits in
              a card or with no card, at page width. On a designed walk page every walk message (Clock-in opens…,
              Finished, so it can&apos;t be edited…, Cancelled) runs as a strip
              straight under the site header, full width and coloured like its
              box (blue information, red cancelled, grey finished); it scrolls
              away with the page, and the Details card and everything else stay
              as they are. Inside the Details card, the facts, essentials, the
              day&apos;s timeline and the description can each have their own
              box (outline, card or light grey) — the facts and essentials with
              a different box on phones and tablets if you like. There are no
              dark looks in the designer. How this group works has the same looks as Before you set off
              (the card, a tick list, numbered steps, a green callout, numbered
              tiles, swiping tiles or one short line) and its own heading;
              like any block it can go in a tab, and a tab holding only it is
              left out for members, who don&apos;t see it. In the list and table looks, Lines in the list puts lines
              between the facts only (no line under the last one), under every
              fact, or none. The description (in the Details card or its own block) can have
              a heading of your own, such as About this walk, or none. The facts and the day&apos;s timeline can have headings of
              your own too, and the Essentials heading your own words; leave
              any blank for none (every block also has Heading above under
              Block layout). The strip&apos;s look is a Page setting: click an empty part of
              the page in the designer (no block selected) and choose Messages
              strip look — as designed, soft grey, bold, compact, a coloured
              stripe, or hidden. More tab looks: a rounded capsule (light or dark when chosen),
              floating pills with a shadow, Material (capitals with a thick
              underline), a green underline, little cards, a green box, big
              words, and square blocks. With Share the full width, tabs fill
              the row on phones too (two tabs take half each); too many to fit
              keep their own width and the row scrolls sideways. Spacing is the same 24 pixels everywhere on a designed page —
              between blocks, between the tabs and their content, between
              blocks in a tab, between columns, and inside cards and the
              Details card (headings sit closer to what they label); the
              spacing options only change it where you choose to. Copy this design to (at the top) takes the design you&apos;re
              editing to another audience — organisers, members or signed-out
              visitors — to check, and Publish there saves it for them. The
              Details card can also have a box around its title (the walk
              name, status, Created by and Manage). Inside the Details card everything is 24 pixels apart, the
              walk name, status and Created by lines included. A box you choose
              (such as Card) keeps its shadow even when the block&apos;s Shadows
              is set to Remove. Where the walk&apos;s messages go is a Page setting too (click
              an empty part of the page): wherever you put the Messages block
              (the default — with no Messages block, no messages show), at the
              top at page width (the full-width strip under the header was taken
              out; pages using it show the messages at the top). The
              Details card&apos;s description can sit on its own or inside the
              title box, under Created by. Messages in the title box puts the walk&apos;s messages inside
              the Details card&apos;s title area — at the top or bottom, as a row
              divided off by a line (a table look) or as message boxes; this
              works when the messages go where you put them (the Page
              setting), so remove any Messages block to avoid showing them
              twice. The Details card can do the whole page&apos;s design on its own:
              Facts shown as picks the facts&apos; own looks, or shows the same
              facts as a walk ticket (plain or colour), colour blocks, a bento
              grid, story cards, round badges or summary tiles — or none — so
              you don&apos;t need a separate block that repeats them. The
              ticket and bento grid have the walk name and buttons built in, so
              the card&apos;s own title row hides when you choose them. Every Facts shown as look shows all the walk&apos;s filled-in
              facts (empty ones hidden, or Not set for organisers if Empty
              facts says so); new looks are stat cards, icons in coloured
              circles, a spec sheet, a receipt, sticky notes and a journey
              line. With the walk ticket, the card&apos;s precise location,
              essentials and description go inside the ticket, so it&apos;s all
              one card, with the same 24 pixels between everything. Inside the title box (in the Title section) is a list of what goes
              in the title box under the name: press + Add and choose Facts,
              Essentials, Precise location, The day&apos;s timeline, Description
              or Map, drag them up and down to set the order, and remove one
              with its bin. Anything in the list shows only there, never twice,
              in its own look (the facts in their Facts shown as look), and
              its own &quot;where it goes&quot; settings are hidden. Pages that put
              the facts, timeline or description in the title box before (or
              used the With fact chips or Big name and four key facts title
              looks) start with those already in the list. The
              Details card&apos;s Title look offers Standard, Plain and Status band. Inside the title box, everything sits under the name at the full
              width of the box, and Space between the things in the title box makes the gaps closer,
              normal (24 pixels) or more without changing the edges. Facts
              arrange only offers what works with the chosen look (a spec sheet
              or list can&apos;t swipe, pills only wrap or swipe), and Spec sheet
              can have its outer border off. Round badges, the walk tickets,
              receipt, numbered list, first fact big, vertical timeline and
              two-tone rows were taken out of Facts shown as; pages using them
              show the plain facts. Any
              page that used one of the title looks that were taken out shows
              the Status band or Plain instead. Facts
              shown as adds a numbered list, cards with a coloured top bar,
              columns with dividers, the first fact big, a vertical
              timeline, big pills, two-tone rows and mini cards. Facts arrange adds One row, swipe sideways and Carousel with
              ‹ › buttons to every Facts shown as look (the walk ticket&apos;s
              facts too), and Space between facts sets the gap between story
              cards, tiles, badges and the rest (none to lots). The Details card&apos;s settings are grouped under headings in the order the card is laid out — Title, Map,
              Precise location, Facts, Timeline, Essentials, Description —
              and only the ones that apply show: the map&apos;s options appear
              once there&apos;s a map, the tablet and phone fact looks only for
              The facts, status options only with the standard title, and so
              on. Turning something back on brings back what was set. Walk messages now look like a plain grey band by default (as in the
              Status band), with other band styles — outlined, a dark bar on
              the left, or just a line underneath — and the coloured boxes
              still there as a choice; the Status band title look has the same
              Band style options. Cancelled walks are listed under History on
              the Walks page, not Upcoming. The walk&apos;s messages and description can sit in the
              Status band&apos;s box too. The day&apos;s timeline has a look of its own
              (a progress bar, a box split into sections, dots on a line, one
              line, or a list); choose which times show — Clock-in opens, Set
              off, Finish. With the Status band title look there&apos;s no Box
              around the title (the band has its own outline); with the map
              down the side, the two sides always have a 24 pixel gap and the
              shorter side stays in view. Cards with a coloured top bar give
              every fact its own colour. Facts shown as on tablets and Facts shown as on
              phones (under Facts shown as) give those devices a different
              design, or Same as on computers; with Plain facts, Plain facts
              look on each device picks the plain look there. The Details card&apos;s settings fold away: click a
              section heading (Title, Map, Precise location, Facts, Timeline,
              Essentials, Description) to open it — the others shut — and
              each shut heading shows a short summary of what&apos;s chosen. The
              less-used settings in a section are under More … options. Block layout (on every block) folds away the
              same way, at the bottom, with a summary such as No frame ·
              Everywhere; opening it shuts the other sections. Card
              table (in Facts shown as) shows the facts in the same outlined
              list as the Walks and Members pages. On a designed page, a walk
              whose meeting point can&apos;t be found on the map shows no map box. The
              Preview menu at the top shows the walk before clock-in opens,
              with clock-in open, under way, finished or cancelled, and a second menu pretends
              you have or haven&apos;t clocked in, so you can see how
              the design changes (Clock in only appears while clock-in is
              open; buttons that depend on the real time, such as Edit, stay as
              they are now). On every layout the walk&apos;s actions are one{" "}
              <strong>Manage</strong> button: its list has Copy share link, Add
              to calendar, Download roster (CSV), Duplicate, Cancel walk, Edit,
              and Remove walk in red at the bottom. Clock in sits beside it
              while clock-in is open. A finished walk has no Edit or Cancel
              walk, by design. Everyone only sees the details that are filled in — an empty
              field (such as Distance or Climb) is left out rather than shown
              as Not set. In the designer, Facts and the Details card can show
              organisers Not set (and None ticked for essentials) to spot
              what&apos;s missing from Edit walk. Members get a Share or save button instead
              (copy the link, add to calendar). The Checklist&apos;s ticks are
              only remembered while the page is open. Switch back to One column
              at any time. Once the walk is Completed, guests see that it has
              finished instead — no join prompt. Names of who is on the walk
              stay private.
            </li>
          </Steps>
          <p>
            Live share links always use {PRODUCTION_APP_URL}, even if you are
            looking at a preview of the site.
          </p>
          <p>
            Under the map, while the walk is still going ahead, there is a 7-day
            forecast for the meeting point. The name on the card is the town for
            that pin, such as Failsworth or Bury, Greater Manchester, rather
            than the wording you typed. Tap a day to see that day’s temperature,
            conditions, wind, humidity, sunrise and sunset, and the hours
            through the day. The walk’s own day starts selected, whichever day
            of the week it is. Temperatures are in Celsius. The card is hidden
            once the walk is completed or cancelled, and it does not appear if
            the walk has no map pin. If the walk is more than 16 days away, the
            card says the forecast is not available yet. The forecast comes from
            Open-Meteo. If Open-Meteo can’t be reached, the card says the
            forecast couldn’t be loaded and the site tries again a minute later
            — the rest of the walk page works as normal.
          </p>
          <p>
            You can publish more than one walk in a week. Each walk has its own
            day, time, meeting point, and share link. Members see every upcoming
            walk on their Walks page, with its status just under the title.
          </p>
          <p className="font-medium text-foreground">
            Cancel, end early, edit, reopen, duplicate, or remove
          </p>
          <ul className="list-disc pl-5">
            <li>
              <strong>Cancel</strong> stops new clock-ins before the walk has
              started. People already on the list stay. You can add a reason.
              Prefer this if you still want a record. Members still see
              cancelled walks on their Walks page as a notice, but they cannot
              open the walk page or add it to a calendar. Organisers open
              cancelled walks from Admin → Walks (or the share link while signed
              in as an organiser). Once the walk is <strong>In progress</strong>
              , Cancel is replaced by End walk — you cannot un-happen a walk
              people are already on.
            </li>
            <li>
              <strong>End walk</strong> appears only while the walk is In
              progress. It marks the walk finished early (right now, or a few
              minutes ago if you are catching up the record). Clock-in closes
              immediately. Anyone still clocked in counts as having stayed for
              the whole (now-shorter) walk — the same as if they never clocked
              out. Use this when the group wraps up early, not Cancel.
            </li>
            <li>
              <strong>Edit</strong> opens the same panel as Create a walk,
              filled in with this walk, to change the title, date, time, length,
              meeting point, or description. Use this when the meeting point
              moves, or when Sunday becomes Wednesday. People already clocked in
              stay on the walk. If you change the title, copy the share link
              again — it uses the new name. Changing the date does not change
              the link. Links you already posted still work and send people to
              the updated page. If the walk was cancelled, saving also puts it
              back on the diary. The walk’s own organiser page shows the same
              map members see on the share link. Once the published start time
              has passed, date, time, and length freeze — changing them would
              rewrite the record under people already walking. Title, meeting
              point, and notes stay editable until the walk is Completed. Self
              clock-in stops at the scheduled end (or earlier if you used End
              walk); if someone was there but missed it, use Add someone.
            </li>
            <li>
              <strong>Reopen</strong> undoes a cancel without changing the
              details. Clock-in works again if the time window is still open.
              Members who get walk emails are told it is back on — unless its
              time has already passed, in which case it just goes back in the
              record without an email (and the confirmation says clock-in stays
              closed).
            </li>
            <li>
              <strong>Duplicate</strong> makes a new walk with the same title,
              meeting point, length, and notes, starting one week later at the
              same time (or further ahead if that would still be in the past).
              Attendance and journey notes stay on the original. You land on the
              new walk so you can check the date before sharing — the
              confirmation names that date.
            </li>
            <li>
              <strong>Remove</strong> deletes the walk and every clock-in on it.
              The share link stops working. Use this only if you do not need the
              record. Only a site owner sees Remove walk — it is the red button
              on the walk page.
            </li>
          </ul>
          <p>
            On the walk page and on the public share link,{" "}
            <strong>Add to calendar</strong> downloads a small calendar file
            (.ics) so phones and calendar apps can save the date, time, meeting
            point, and a link back to the walk. Cancelled and completed walks do
            not offer Add to calendar — for members or organisers — and the
            calendar file link returns not found. Those buttons update live if
            you leave the walk page open as the status changes (for example
            Cancel becomes End walk when start time arrives).
          </p>
          <p>
            Once a walk reaches <strong>Completed</strong>, Cancel, End walk,
            and Edit disappear from its page — it already happened, so there is
            nothing left to cancel, cut short, or change. Remove, Duplicate, and
            the CSV export are still there if you need them.{" "}
            <strong>Add someone</strong> stays, so you can still put a forgotten
            clock-in on the list. Add someone, Journey add/edit, and the
            Attended label also update live if you leave the page open through
            start or finish.
          </p>
          <p>
            {cancelledWalkRetentionDays !== null ? (
              <>
                If a cancelled walk is not reopened, it is deleted automatically
                after <strong>{cancelledWalkRetentionDays} days</strong>.
              </>
            ) : (
              "Auto-delete for cancelled walks is currently off, so a cancelled walk is kept until it's reopened or removed by hand."
            )}{" "}
            Set the number of days, or turn auto-delete off, in Settings → Data
            retention.
          </p>
          <p>
            Open the walk from the list. <strong>Attendance</strong> is names
            and clock-in time for whoever is on the walk right now. Anyone who
            has clocked out moves down into its own <strong>Clocked out</strong>{" "}
            list below — so the count always matches the rows under it — with
            the same details available. Once the walk reaches Completed, the
            first list relabels itself to <strong>Attended</strong>: everyone
            still in it stayed for the whole walk without clocking out, so “on
            the walk” would be wrong once it’s over — and clocking out itself
            stops being offered to members from then on, since there is nothing
            left to leave early from. Tap a row for email, clock-out time, any
            clock-out reason, the emergency contact if they have added one, and
            (for owners) health notes. <strong>Remove</strong> sits on each list
            row (same as Journey and reports) when the walk is not cancelled —
            it asks you to confirm. If more than 20 people clocked in, Previous
            and Next sit under either list.
          </p>
          <p>
            <strong>Journey</strong> is the story of the walk — short timed
            events (a cafe stop, a viewpoint) with an optional note. It sits at
            the bottom of the organiser walk page. Add events with{" "}
            <strong>Manage → Add event</strong> once the walk has started,
            including after Completed. Tap a row to edit;{" "}
            <strong>Remove</strong> on the list asks you to confirm, same as
            notices and reports. Use <strong>View journey</strong> to open the
            animated timeline in a drawer — members get the same button at the
            top of the walk link. Up to 20 events. A cancelled walk keeps what
            you already wrote, but you cannot add more.
          </p>
          <p>
            In the attendance list, anyone who reported a condition has a grey{" "}
            <strong>Condition</strong> tag on their row (if you may read health
            notes), and a line under the list&apos;s header says how many.{" "}
            <strong>Add someone</strong> (in the <strong>Manage</strong> menu,
            while people can still be added) is for a
            member who was there but did not clock in — phone died, they forgot,
            or the window had already closed. They must already have an account;
            you cannot add someone who has never signed up. While the walk is
            still open, they are clocked in at the time you add them — including
            someone who already clocked out and came back. After Completed, they
            show as attending from the start, with no health notes, and anyone
            already on the roster cannot be added again. Reopen a cancelled walk
            first if you need to add someone to it. Search by name or email —
            the list shows up to 40 matches so it stays quick even with
            thousands of members.
          </p>
          <p>
            To take someone off the roster, use <strong>Remove</strong> on their
            row. That deletes their clock-in for this walk (from the roster and
            from their history for this walk). Use it for a mistaken add or if
            they were never there. Reopen a cancelled walk first if you need to
            remove someone from it.
          </p>
          <p>
            Walks titled <strong>[Demo]</strong> are sample rows so you can
            check Previous and Next on a long list. Search Demo on Walks →
            History. A few also have sample <strong>Journey</strong> events so
            you can see the timeline. The same Demo prefix is on sample accident
            reports. Remove them with{" "}
            <Link href="/admin/settings/reset">Settings → Reset the site</Link>,
            or delete those rows one by one.
          </p>
          <p>
            Download roster (CSV) gives you names, emails, times, clock-out
            reasons, when each person ticked the pre-walk check, and their
            emergency contact name and phone. Owners also get any health notes
            for that walk. Someone you added with Add someone shows “Not given”
            for the pre-walk check, because they never ticked it. The file is
            named after the walk’s date and title. On a phone, the action
            buttons under the map (roster, calendar, Duplicate, Cancel or End
            walk, Edit, Remove) scroll sideways in one row.
          </p>
        </GuideBody>
      </AccordionContent>
    </AccordionItem>
  );
}

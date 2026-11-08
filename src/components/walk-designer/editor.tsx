"use client";

// No stylesheet import: Puck (0.22+) adds its own styles when it opens. An
// import here became a separate file loaded on demand, which failed to load
// alongside the site's inline CSS (experimental.inlineCss) and crashed the page.
import { DesignerNarrowCover } from "@/components/designer-narrow-cover";
import { useMemo, useRef, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
// Puck's styles up front, the copy with no outside font: otherwise Puck adds
// them itself with an @import of rsms.me/inter, which the site's security
// rules (style-src in next.config.ts) block, filling the console with errors.
import "@puckeditor/core/no-external.css";
import { toast } from "sonner";
import { saveWalkDesign } from "@/server/actions";
import { extractWalkDesignCopy, withSiteCopy } from "@/lib/walk-design-copy";
import { WalkWordingProvider, useWalkWording } from "@/components/walk-wording-context";
import { WalkClockInPreview, WalkClockPreview } from "@/hooks/use-walk-clock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { effectiveEndsAt, walkOpensAt } from "@/lib/walk-window";
import { DESIGNER_UI, DESIGNER_VIEWPORTS, DesignerStripItem, DesignerTopBar } from "@/components/designer-top-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import type { WalkDesignAudience, WalkDesigns } from "@/lib/walk-page-choice";
import { walkDesignConfig } from "./config";
import { PreviewAudience, WalkPartsProvider } from "./parts";
import { DEFAULT_WALK_DESIGN, defaultDesignFor } from "./presets";
import { isPuckData } from "./render";
import { PuckFrameStyles } from "@/components/puck-frame-styles";

/** Older designs have no page-card setting. They join, and the switch shows that. */
function withJoinDefault(data: Data): Data {
  const root = data.root ?? { props: {} };
  const props = { ...(root.props ?? {}) } as { join?: string };
  if (props.join === "join" || props.join === "inset") return data;
  // Root props are typed as { title } only. The page settings (join, and the
  // messages options) are stored beside that, so this has to be asserted.
  const nextProps = { ...props, join: "join" };
  return {
    ...data,
    root: { ...root, props: nextProps as unknown as Data["root"]["props"] },
  };
}

const AUDIENCES: { id: WalkDesignAudience; label: string }[] = [
  { id: "organiser", label: "Organisers and owners" },
  { id: "member", label: "Members" },
  { id: "visitor", label: "Signed-out visitors" },
];

type Moment =
  "now" | "before" | "open" | "under-way" | "finished" | "cancelled";
const MOMENTS: { id: Moment; label: string }[] = [
  { id: "now", label: "As it is now" },
  { id: "before", label: "Before clock-in opens" },
  { id: "open", label: "Clock-in open" },
  { id: "under-way", label: "In progress" },
  { id: "finished", label: "Finished" },
  { id: "cancelled", label: "Cancelled" },
];

type ClockedIn = "real" | "in" | "not-in" | "out";
const CLOCKED_IN: { id: ClockedIn; label: string }[] = [
  { id: "real", label: "As it really is" },
  { id: "not-in", label: "Not clocked in" },
  { id: "in", label: "Clocked in" },
  { id: "out", label: "Clocked out early" },
];

/** The walk as if cancelled: the badge, status and messages say so, and there's no clocking in. */
function cancelledParts(parts: WalkIdeaParts): WalkIdeaParts {
  const at = new Date(
    new Date(parts.timing.startsAt).getTime() - 24 * 60 * 60_000,
  ).toISOString();
  return {
    ...parts,
    headline: { ...parts.headline, cancelledAt: at },
    timing: { ...parts.timing, cancelledAt: at },
    live: null,
    liveCompact: null,
    howItWorks: null,
    notices: (
      <Alert variant="destructive">
        <AlertTitle>Walk cancelled</AlertTitle>
        <AlertDescription>
          Preview: the reason given when cancelling shows here.
        </AlertDescription>
      </Alert>
    ),
  };
}

/** A time when the walk is at that moment, for the preview's pretend clock (null: the real time). */
function momentTime(parts: WalkIdeaParts, moment: Moment): Date | null {
  if (moment === "now" || moment === "cancelled") return null;
  const start = new Date(parts.timing.startsAt);
  const minute = 60_000;
  if (moment === "before")
    return new Date(walkOpensAt(start).getTime() - 3 * 60 * minute);
  if (moment === "open") return new Date(start.getTime() - 10 * minute);
  if (moment === "under-way")
    return new Date(
      start.getTime() + Math.min(30, parts.timing.durationMins / 2) * minute,
    );
  const end = effectiveEndsAt({
    durationMins: parts.timing.durationMins,
    endedAt: parts.timing.endedAt ? new Date(parts.timing.endedAt) : null,
    startsAt: start,
  });
  return new Date(end.getTime() + 2 * 60 * minute);
}

/** What each audience's preview shows: members have no organiser buttons or Attended list; visitors no clock-in either. */
function partsFor(
  parts: WalkIdeaParts,
  audience: WalkDesignAudience,
): WalkIdeaParts {
  // "How this group works" is only for signed-out visitors.
  if (audience === "organiser") return { ...parts, howItWorks: null };
  return {
    ...parts,
    back:
      audience === "visitor"
        ? { href: "/", label: "Home" }
        : { href: "/walks", label: "Walks" },
    howItWorks: audience === "visitor" ? parts.howItWorks : null,
    attended: null,
    liveCompact: null,
    share: null,
    tools: null,
    live: audience === "visitor" ? null : parts.live,
  };
}

/**
 * The walk page designer: Puck's editor, full screen over a real walk so the
 * preview shows its actual details. Drag blocks from the left, set each
 * one's look on the right, and Publish saves the design for the chosen
 * audience (walk pages use it when Layout is set to Designed).
 */
export function WalkDesignEditor({
  designs,
  onClose,
  parts,
}: {
  designs: WalkDesigns;
  onClose: () => void;
  parts: WalkIdeaParts;
}) {
  const siteWording = useWalkWording();
  const siteCopy = useMemo(
    () => ({
      tips: parts.tips,
      steps: parts.howItWorksSteps ?? [],
      wording: siteWording,
    }),
    [parts.howItWorksSteps, parts.tips, siteWording],
  );
  const prepare = (data: Data) => withSiteCopy(withJoinDefault(data), siteCopy);
  const [audience, setAudience] = useState<WalkDesignAudience>("organiser");
  const [saved, setSaved] = useState<WalkDesigns>(designs);
  const [draftWording, setDraftWording] = useState(siteWording);
  const [start, setStart] = useState<{ key: number; data: Data }>(() => ({
    key: 0,
    data: withSiteCopy(
      withJoinDefault(isPuckData(designs.organiser) ? designs.organiser : DEFAULT_WALK_DESIGN()),
      {
        tips: parts.tips,
        steps: parts.howItWorksSteps ?? [],
        wording: siteWording,
      },
    ),
  }));
  // What's in the editor right now (published or not), for Copy to.
  const current = useRef<Data | null>(null);
  const [moment, setMoment] = useState<Moment>("now");
  const [clockedIn, setClockedIn] = useState<ClockedIn>("real");
  const preview = useMemo(() => {
    const forAudience = partsFor(parts, audience);
    return moment === "cancelled" ? cancelledParts(forAudience) : forAudience;
  }, [parts, audience, moment]);
  const pretendNow = useMemo(() => momentTime(parts, moment), [parts, moment]);

  function open(next: WalkDesignAudience) {
    setAudience(next);
    const existing = saved[next];
    const data = prepare(isPuckData(existing) ? existing : defaultDesignFor(next));
    current.current = data;
    setDraftWording(extractWalkDesignCopy(data, siteWording).wording ?? siteWording);
    setStart((was) => ({ key: was.key + 1, data }));
  }

  /**
   * Copy to: the design in the editor goes to another audience's page, ready
   * to check; Publish there saves it (nothing is saved until then).
   */
  function copyTo(target: WalkDesignAudience) {
    const data = structuredClone(current.current ?? start.data);
    setAudience(target);
    current.current = data;
    setStart((was) => ({ key: was.key + 1, data }));
    const name = AUDIENCES.find((item) => item.id === target)?.label;
    toast.info(`Copied to ${name}. Press Publish to save it for them.`);
  }


  async function publish(data: Data) {
    const result = await saveWalkDesign(audience, JSON.stringify(data));
    if (result && !result.ok) {
      toast.error(result.error);
      return;
    }
    setSaved((current) => ({ ...current, [audience]: data }));
    toast.success(result?.message ?? "Design saved.");
  }

  const topBar = (
    <DesignerTopBar
      closeLabel="Close the designer"
      note="Publish saves this design for the people chosen here."
      onClose={onClose}
      onPublish={publish}
      strip={
        <>
        <DesignerStripItem first label="For">
          <Select onValueChange={(value) => open(value as WalkDesignAudience)} value={audience}>
            <SelectTrigger aria-label="Who the design is for" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {AUDIENCES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DesignerStripItem>
        <DesignerStripItem label="Copy to">
          <Select
            onValueChange={(value) => copyTo(value as WalkDesignAudience)}
            value=""
          >
            <SelectTrigger aria-label="Copy this design to" className="h-8 w-full">
              <SelectValue placeholder="Another audience…" />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {AUDIENCES.filter((item) => item.id !== audience).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DesignerStripItem>
        <DesignerStripItem label="Preview">
          <Select
            onValueChange={(value) => setMoment(value as Moment)}
            value={moment}
          >
            <SelectTrigger aria-label="Show the walk" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {MOMENTS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DesignerStripItem>
        <DesignerStripItem label="Clocked in">
          <Select
            onValueChange={(value) => setClockedIn(value as ClockedIn)}
            value={clockedIn}
          >
            <SelectTrigger aria-label="Clocked in or not" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {CLOCKED_IN.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DesignerStripItem>
        </>
      }
      title="Walk page"
    />
  );

  return (
    // Its menus (ready-made designs, Preview, Clocked in) open at z-[100]:
    // the site's pop-up lists sit at z-[80], under this.
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      data-designer=""
      role="dialog"
      aria-label="Walk page designer"
      aria-modal="true"
    >
      {/* Too narrow (a resized window): a message over it, nothing lost. */}
      <DesignerNarrowCover />
      <div className="min-h-0 flex-1">
        <WalkClockPreview.Provider value={pretendNow}>
          <WalkClockInPreview.Provider
            value={clockedIn === "real" ? null : clockedIn}
          >
            <WalkWordingProvider wording={draftWording}>
            <PreviewAudience.Provider value={audience}>
              <WalkPartsProvider parts={preview}>
                <Puck
                  config={walkDesignConfig}
                  // Fill the space under the bar above. Puck's own default is the
                  // full screen height, which pushed its bottom off-screen, so
                  // the page and the panels couldn't scroll to the end.
                  height="100%"
                  data={start.data}
                  headerTitle={
                    AUDIENCES.find((item) => item.id === audience)?.label
                  }
                  key={`${audience}-${start.key}`}
                  onChange={(data) => {
                    current.current = data;
                    const extracted = extractWalkDesignCopy(data, siteWording);
                    setDraftWording(extracted.wording ?? siteWording);
                  }}
                  overrides={{
                    iframe: PuckFrameStyles,
                    // The one top bar (designer-top-bar.tsx) in place of Puck's own.
                    header: () => topBar,
                  }}
                  ui={DESIGNER_UI}
                  viewports={DESIGNER_VIEWPORTS}
                />
              </WalkPartsProvider>
            </PreviewAudience.Provider>
            </WalkWordingProvider>
          </WalkClockInPreview.Provider>
        </WalkClockPreview.Provider>
      </div>
    </div>
  );
}

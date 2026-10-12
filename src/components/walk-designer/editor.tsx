"use client";

// No stylesheet import: Puck (0.22+) adds its own styles when it opens. An
// import here became a separate file loaded on demand, which failed to load
// alongside the site's inline CSS (experimental.inlineCss) and crashed the page.
import { useMemo, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import { toast } from "sonner";
import { X } from "lucide-react";
import { saveWalkDesign } from "@/server/actions";
import { WalkClockInPreview, WalkClockPreview } from "@/hooks/use-walk-clock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { effectiveEndsAt, walkOpensAt } from "@/lib/walk-window";
import { Button } from "@/components/ui/button";
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
import { DEFAULT_WALK_DESIGN, WALK_DESIGN_PRESETS } from "./presets";
import { isPuckData } from "./render";

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
  { id: "under-way", label: "Under way" },
  { id: "finished", label: "Finished" },
  { id: "cancelled", label: "Cancelled" },
];

type ClockedIn = "real" | "in" | "not-in";
const CLOCKED_IN: { id: ClockedIn; label: string }[] = [
  { id: "real", label: "Clocked in: as it really is" },
  { id: "not-in", label: "Not clocked in" },
  { id: "in", label: "Clocked in" },
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
        <AlertTitle>This walk has been cancelled</AlertTitle>
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
  const [audience, setAudience] = useState<WalkDesignAudience>("organiser");
  const [saved, setSaved] = useState<WalkDesigns>(designs);
  const [start, setStart] = useState<{ key: number; data: Data }>(() => ({
    key: 0,
    data: isPuckData(designs.organiser)
      ? designs.organiser
      : DEFAULT_WALK_DESIGN(),
  }));
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
    setStart((current) => ({
      key: current.key + 1,
      data: isPuckData(existing) ? existing : DEFAULT_WALK_DESIGN(),
    }));
  }

  function applyPreset(id: string) {
    const preset = WALK_DESIGN_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setStart((current) => ({ key: current.key + 1, data: preset.data() }));
    toast.info(`Started from "${preset.label}". Publish to save it.`);
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

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      role="dialog"
      aria-label="Walk page designer"
      aria-modal="true"
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <span className="font-semibold">Walk page designer</span>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {AUDIENCES.map((item) => (
            <Button
              key={item.id}
              onClick={() => open(item.id)}
              size="sm"
              type="button"
              variant={audience === item.id ? "default" : "ghost"}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Select onValueChange={applyPreset} value="">
          <SelectTrigger className="h-8 w-64">
            <SelectValue placeholder="Start from a ready-made design…" />
          </SelectTrigger>
          <SelectContent>
            {WALK_DESIGN_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setMoment(value as Moment)}
          value={moment}
        >
          <SelectTrigger aria-label="Show the walk" className="h-8 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOMENTS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                Preview: {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setClockedIn(value as ClockedIn)}
          value={clockedIn}
        >
          <SelectTrigger aria-label="Clocked in or not" className="h-8 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLOCKED_IN.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          aria-label="Close the designer"
          className="ml-auto"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <WalkClockPreview.Provider value={pretendNow}>
          <WalkClockInPreview.Provider
            value={clockedIn === "real" ? null : clockedIn}
          >
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
                  onPublish={publish}
                />
              </WalkPartsProvider>
            </PreviewAudience.Provider>
          </WalkClockInPreview.Provider>
        </WalkClockPreview.Provider>
      </div>
    </div>
  );
}

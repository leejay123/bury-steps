"use client";

// No stylesheet import: Puck (0.22+) adds its own styles when it opens. An
// import here became a separate file loaded on demand, which failed to load
// alongside the site's inline CSS (experimental.inlineCss) and crashed the page.
import { useMemo, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import { toast } from "sonner";
import { X } from "lucide-react";
import { saveWalkDesign } from "@/server/actions";
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
import { WalkPartsProvider } from "./parts";
import { DEFAULT_WALK_DESIGN, WALK_DESIGN_PRESETS } from "./presets";
import { isPuckData } from "./render";

const AUDIENCES: { id: WalkDesignAudience; label: string }[] = [
  { id: "organiser", label: "Organisers and owners" },
  { id: "member", label: "Members" },
  { id: "visitor", label: "Signed-out visitors" },
];

/** What each audience's preview shows: members have no organiser buttons or Attended list; visitors no clock-in either. */
function partsFor(
  parts: WalkIdeaParts,
  audience: WalkDesignAudience,
): WalkIdeaParts {
  if (audience === "organiser") return parts;
  return {
    ...parts,
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
  const preview = useMemo(() => partsFor(parts, audience), [parts, audience]);

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
        <WalkPartsProvider parts={preview}>
          <Puck
            config={walkDesignConfig}
            data={start.data}
            headerTitle={AUDIENCES.find((item) => item.id === audience)?.label}
            key={`${audience}-${start.key}`}
            onPublish={publish}
          />
        </WalkPartsProvider>
      </div>
    </div>
  );
}

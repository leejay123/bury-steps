import type { AboutRule } from "@/lib/homepage-copy";
import {
  WALK_WORDING_DEFAULTS,
  parseWalkWording,
  type WalkWording,
  type WalkWordingKey,
} from "@/lib/walk-wording";

/** Card text and status lines stored on walk-designer blocks. */
export type WalkDesignSiteCopy = {
  tips: readonly string[];
  steps: readonly AboutRule[];
  wording: WalkWording;
};

export const STATUS_LINE_FIELDS = [
  { prop: "upcoming", name: "upcomingLabel", rest: "upcomingLine", label: "Upcoming" },
  { prop: "open", name: "openLabel", rest: "openLine", label: "Clock-in open" },
  { prop: "live", name: "liveLabel", rest: "liveLine", label: "In progress" },
  { prop: "finished", name: "finishedLabel", rest: "finishedAttended", label: "Finished" },
  { prop: "cancelled", name: "cancelledLabel", rest: "cancelledLine", label: "Cancelled" },
] as const;

export const STATUS_MESSAGE_FIELDS = [
  { prop: "memberBefore", key: "memberBefore", label: "Members, before clock-in opens" },
  { prop: "memberMissed", key: "memberMissed", label: "Members who didn't clock in, after the walk" },
  { prop: "visitorFinished", key: "visitorFinished", label: "Visitors, after the walk" },
  { prop: "organiserFinished", key: "organiserFinished", label: "Organisers, after the walk" },
  { prop: "cancelledTitle", key: "cancelledTitle", label: "Cancelled: heading" },
  { prop: "cancelledNext", key: "cancelledNext", label: "Cancelled: what to do next" },
] as const;

export function joinStatusLine(name: string, rest: string): string {
  return `${name} · ${rest}`;
}

export function splitStatusLine(text: string): { name: string; rest: string } {
  const [first, ...others] = text.split("·");
  return { name: (first ?? "").trim(), rest: others.join("·").trim() };
}

function walkBlocks(
  node: unknown,
  visit: (type: string, props: Record<string, unknown>) => void,
): void {
  if (Array.isArray(node)) {
    for (const item of node) walkBlocks(item, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  const rec = node as Record<string, unknown>;
  if (typeof rec.type === "string" && rec.props && typeof rec.props === "object") {
    visit(rec.type, rec.props as Record<string, unknown>);
    walkBlocks(rec.props, visit);
    return;
  }
  for (const value of Object.values(rec)) walkBlocks(value, visit);
}

function readTips(props: Record<string, unknown>): string[] | null {
  if (!Array.isArray(props.tips)) return null;
  const tips = props.tips
    .map((row) => (row && typeof row === "object" ? String((row as { text?: unknown }).text ?? "").trim() : ""))
    .filter(Boolean);
  return tips.length > 0 ? tips : [];
}

function readSteps(props: Record<string, unknown>): AboutRule[] | null {
  if (!Array.isArray(props.steps)) return null;
  const steps = props.steps
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const title = String((row as { title?: unknown }).title ?? "").trim();
      const body = String((row as { body?: unknown }).body ?? "").trim();
      if (!title && !body) return null;
      return { title, body };
    })
    .filter((row): row is AboutRule => row !== null);
  return steps;
}

function statusLinePropsHaveWording(props: Record<string, unknown>): boolean {
  return STATUS_LINE_FIELDS.some((field) => String(props[field.prop] ?? "").trim());
}

function messagePropsHaveWording(props: Record<string, unknown>): boolean {
  return STATUS_MESSAGE_FIELDS.some((field) => String(props[field.prop] ?? "").trim());
}

function statusPropsHaveWording(props: Record<string, unknown>): boolean {
  return statusLinePropsHaveWording(props) || messagePropsHaveWording(props);
}

function rootPropsOf(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const root = (data as { root?: { props?: unknown } }).root;
  if (!root || typeof root !== "object") return null;
  if (!root.props || typeof root.props !== "object") return null;
  return root.props as Record<string, unknown>;
}

function ensureRootProps(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as { root?: { props?: Record<string, unknown> } };
  if (!rec.root || typeof rec.root !== "object") rec.root = { props: {} };
  if (!rec.root.props || typeof rec.root.props !== "object") rec.root.props = {};
  return rec.root.props;
}

/** Overlay Status-block fields onto the site wording (blank keeps the current line). */
export function wordingFromStatusProps(
  props: Record<string, unknown>,
  base: WalkWording = WALK_WORDING_DEFAULTS,
): WalkWording {
  const next: WalkWording = { ...base };
  for (const field of STATUS_LINE_FIELDS) {
    const raw = String(props[field.prop] ?? "").trim();
    if (!raw) continue;
    const { name, rest } = splitStatusLine(raw);
    if (name) next[field.name] = name;
    if (rest) next[field.rest] = rest;
  }
  for (const field of STATUS_MESSAGE_FIELDS) {
    const raw = String(props[field.prop] ?? "").trim();
    if (raw) next[field.key] = raw;
  }
  return parseWalkWording(next);
}

export function statusLinePropsFromWording(wording: WalkWording): Record<string, string> {
  const props: Record<string, string> = {};
  for (const field of STATUS_LINE_FIELDS) {
    props[field.prop] = joinStatusLine(wording[field.name], wording[field.rest]);
  }
  return props;
}

export function messagePropsFromWording(wording: WalkWording): Record<string, string> {
  const props: Record<string, string> = {};
  for (const field of STATUS_MESSAGE_FIELDS) {
    props[field.prop] = wording[field.key];
  }
  return props;
}

export function statusPropsFromWording(wording: WalkWording): Record<string, string> {
  return { ...statusLinePropsFromWording(wording), ...messagePropsFromWording(wording) };
}

export type ExtractedWalkDesignCopy = {
  tips: string[] | null;
  steps: AboutRule[] | null;
  wording: WalkWording | null;
};

/** First Before / How this group works / Status / Messages block that has copy. */
export function extractWalkDesignCopy(data: unknown, base?: WalkWording): ExtractedWalkDesignCopy {
  const found: ExtractedWalkDesignCopy = { tips: null, steps: null, wording: null };
  let statusProps: Record<string, unknown> | null = null;
  let messageProps: Record<string, unknown> | null = null;
  walkBlocks(data, (type, props) => {
    if (type === "Before" && found.tips === null) {
      const tips = readTips(props);
      if (tips && tips.length > 0) found.tips = tips;
    }
    if (type === "HowItWorks" && found.steps === null) {
      const steps = readSteps(props);
      if (steps && steps.length > 0) found.steps = steps;
    }
    if (type === "Status" && statusProps === null && statusPropsHaveWording(props)) {
      statusProps = props;
    }
    if (type === "Messages" && messageProps === null && messagePropsHaveWording(props)) {
      messageProps = props;
    }
  });
  const root = rootPropsOf(data);
  const rootMessages = root && messagePropsHaveWording(root) ? root : null;
  if (statusProps || messageProps || rootMessages) {
    found.wording = wordingFromStatusProps(
      { ...(statusProps ?? {}), ...(messageProps ?? {}), ...(rootMessages ?? {}) },
      base,
    );
  }
  return found;
}

/**
 * Fill empty Before / How this group works / Status copy from the site's
 * current wording, so opening the designer shows what's live.
 */
export function withSiteCopy<T>(data: T, copy: WalkDesignSiteCopy): T {
  const cloned = structuredClone(data);
  const root = ensureRootProps(cloned);
  // Always the site's current wording (Publish saves it there, so it is the source):
  // a design saved with older wording would otherwise publish that back.
  if (root) {
    Object.assign(root, messagePropsFromWording(copy.wording));
  }
  walkBlocks(cloned, (type, props) => {
    if (type === "Before") {
      const tips = readTips(props);
      if (!tips || tips.length === 0) {
        props.tips = copy.tips.map((text) => ({ text }));
      }
    }
    if (type === "HowItWorks") {
      const steps = readSteps(props);
      if (!steps || steps.length === 0) {
        props.steps = copy.steps.map((step) => ({ title: step.title, body: step.body }));
      }
    }
    if (type === "Status" && !statusLinePropsHaveWording(props)) {
      Object.assign(props, statusLinePropsFromWording(copy.wording));
    }
  });
  return cloned;
}

export function wordingKeys(): WalkWordingKey[] {
  return Object.keys(WALK_WORDING_DEFAULTS) as WalkWordingKey[];
}

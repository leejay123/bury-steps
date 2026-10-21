import {
  Backpack,
  CalendarDays,
  Camera,
  Clock,
  CloudSun,
  Coffee,
  Flag,
  Footprints,
  Info,
  ListChecks,
  MapPin,
  Route,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The icons a tab or an accordion section can have, so both blocks can
 * match. "Automatic" picks one from the name (Map & weather → a map pin).
 */
const ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  map: { label: "Map pin", icon: MapPin },
  route: { label: "Route", icon: Route },
  weather: { label: "Weather", icon: CloudSun },
  backpack: { label: "Backpack", icon: Backpack },
  people: { label: "People", icon: Users },
  clock: { label: "Clock", icon: Clock },
  calendar: { label: "Calendar", icon: CalendarDays },
  info: { label: "Information", icon: Info },
  checklist: { label: "Checklist", icon: ListChecks },
  footprints: { label: "Footprints", icon: Footprints },
  camera: { label: "Camera", icon: Camera },
  coffee: { label: "Cup", icon: Coffee },
  safety: { label: "Shield", icon: ShieldCheck },
  flag: { label: "Flag", icon: Flag },
};

/** Words in a name, and the icon they suggest (the first that matches wins). */
const BY_NAME: [RegExp, string][] = [
  [/map|where|location|meet/i, "map"],
  [/route|journey|path|trail/i, "route"],
  [/weather|forecast/i, "weather"],
  [/before|set off|bring|kit|pack|essential/i, "backpack"],
  [/attend|who|people|going|walkers/i, "people"],
  [/time|timeline|schedule/i, "clock"],
  [/date|calendar/i, "calendar"],
  [/photo|picture/i, "camera"],
  [/cafe|café|coffee|cuppa|refresh/i, "coffee"],
  [/safe|rule|livestock/i, "safety"],
  [/check|list/i, "checklist"],
  [/walk|step/i, "footprints"],
];

export const SECTION_ICON_OPTIONS = [
  { label: "Automatic (from the name)", value: "auto" },
  { label: "No icon", value: "none" },
  ...Object.entries(ICONS).map(([value, { label }]) => ({ label, value })),
];

function iconKey(choice: string | undefined, name: string): string | null {
  if (choice === "none") return null;
  if (choice && choice !== "auto" && ICONS[choice]) return choice;
  return BY_NAME.find(([words]) => words.test(name))?.[1] ?? "info";
}

/** A tab's or section's icon, sized for the text beside it. */
export function SectionIcon({
  choice,
  name,
  className,
}: {
  choice?: string;
  name: string;
  className?: string;
}) {
  const key = iconKey(choice, name);
  if (!key) return null;
  const { icon: Icon } = ICONS[key];
  return <Icon aria-hidden className={cn("size-4 shrink-0", className)} />;
}

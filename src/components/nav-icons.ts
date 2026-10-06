import {
  Bell,
  BookOpen,
  ChartColumn,
  FileBarChart,
  Footprints,
  History,
  House,
  MessageSquare,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Each menu link's icon, by its label. The header drawn before the page
 * loads (header-boot.tsx) uses the same drawings, from NAV_ICON_SVG in
 * header-chrome.ts; header-chrome.test.ts keeps the two in step. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  Home: House,
  Walks: Footprints,
  Notices: Bell,
  Progress: ChartColumn,
  History: History,
  Members: Users,
  Messages: MessageSquare,
  Reports: FileBarChart,
  Settings: SlidersHorizontal,
  Guide: BookOpen,
};

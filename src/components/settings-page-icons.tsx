import {
  AlertTriangle,
  Archive,
  Bell,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Mail,
  Quote,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Text,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icon per Settings page (see src/lib/settings-pages.ts), shared by the
 * hub's card table and the top nav's Settings dropdown so the two always
 * show the same picture for the same page. */
const SETTINGS_PAGE_ICONS: Record<string, LucideIcon> = {
  "/admin/settings/branding": LayoutGrid,
  "/admin/settings/hero-photos": ImageIcon,
  "/admin/settings/homepage-layout": SlidersHorizontal,
  "/admin/settings/testimonials": Quote,
  "/admin/settings/faqs": HelpCircle,
  "/admin/settings/site-wording/how-this-started": Text,
  "/admin/settings/notices": Bell,
  "/admin/settings/emails": Mail,
  "/admin/settings/subscribers": Users,
  "/admin/settings/progress": TrendingUp,
  "/admin/settings/behaviour": Settings2,
  "/admin/settings/retention": Archive,
  "/admin/settings/cache": RefreshCw,
  "/admin/settings/reset": AlertTriangle,
};

export function SettingsPageIcon({
  href,
  ...props
}: { href: string } & React.ComponentProps<LucideIcon>) {
  const Icon = SETTINGS_PAGE_ICONS[href] ?? SlidersHorizontal;
  return <Icon {...props} />;
}

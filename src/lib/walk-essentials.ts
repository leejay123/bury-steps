import {
  Accessibility,
  Baby,
  Backpack,
  Bike,
  Bus,
  Camera,
  CloudRain,
  Coffee,
  Dog,
  Droplets,
  Fence,
  Flag,
  Footprints,
  Heart,
  Info,
  Map,
  Mountain,
  Sandwich,
  ShieldCheck,
  SquareParking,
  Sun,
  Tent,
  Toilet,
  TrainFront,
  Trees,
  Utensils,
  Waves,
  Wifi,
  Anchor,
  Apple,
  Armchair,
  Beer,
  Bird,
  Bug,
  Car,
  Castle,
  Cat,
  Church,
  Clock,
  CloudSun,
  Compass,
  CupSoda,
  Ear,
  Eye,
  Fish,
  Flashlight,
  Flower,
  HeartPulse,
  Hospital,
  IceCreamCone,
  Landmark,
  Leaf,
  MapPin,
  MountainSnow,
  PersonStanding,
  Phone,
  Pill,
  Pizza,
  Plug,
  PoundSterling,
  Rabbit,
  Rainbow,
  Route,
  Sailboat,
  Shirt,
  ShoppingBag,
  Shovel,
  Signpost,
  Snowflake,
  Sprout,
  Squirrel,
  Star,
  Store,
  Sunrise,
  Sunset,
  Thermometer,
  Ticket,
  Tractor,
  TreePine,
  TriangleAlert,
  Umbrella,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";

/**
 * Tick-box facilities for a walk (Create / Edit walk → Details → Essentials).
 * The list itself is the owner's to edit (Settings → Walk essentials), saved
 * as SiteSetting.walkEssentials; until then it's DEFAULT_WALK_ESSENTIALS.
 * Walks store the items' keys in Walk.essentials, so renaming an item or
 * changing its icon changes it on every walk, and a removed item simply
 * stops showing. Icons are Lucide, like the rest of the site, picked by name
 * from ESSENTIAL_ICONS.
 */

export type EssentialItem = { key: string; label: string; icon: string };

/** Icons an essential can use, by name, in the order the picker lists them. */
export const ESSENTIAL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  toilet: { icon: Toilet, label: "Toilet" },
  parking: { icon: SquareParking, label: "Parking" },
  coffee: { icon: Coffee, label: "Coffee" },
  food: { icon: Utensils, label: "Food" },
  sandwich: { icon: Sandwich, label: "Packed lunch" },
  water: { icon: Droplets, label: "Water" },
  dog: { icon: Dog, label: "Dog" },
  access: { icon: Accessibility, label: "Accessible" },
  baby: { icon: Baby, label: "Pushchair / baby" },
  bus: { icon: Bus, label: "Bus" },
  train: { icon: TrainFront, label: "Train" },
  bike: { icon: Bike, label: "Bike" },
  boots: { icon: Footprints, label: "Boots" },
  backpack: { icon: Backpack, label: "Backpack" },
  stiles: { icon: Fence, label: "Stiles / gates" },
  hills: { icon: Mountain, label: "Hills" },
  trees: { icon: Trees, label: "Woodland" },
  waterside: { icon: Waves, label: "Waterside" },
  rain: { icon: CloudRain, label: "Rain" },
  sun: { icon: Sun, label: "Sun" },
  camera: { icon: Camera, label: "Photos" },
  map: { icon: Map, label: "Map" },
  flag: { icon: Flag, label: "Flag" },
  shelter: { icon: Tent, label: "Shelter" },
  safety: { icon: ShieldCheck, label: "Safety" },
  heart: { icon: Heart, label: "Heart" },
  wifi: { icon: Wifi, label: "Signal / wifi" },
  info: { icon: Info, label: "Info" },
  car: { icon: Car, label: "Car" },
  cat: { icon: Cat, label: "Cat" },
  bird: { icon: Bird, label: "Birds" },
  fish: { icon: Fish, label: "Fish / fishing" },
  flower: { icon: Flower, label: "Flowers" },
  leaf: { icon: Leaf, label: "Nature" },
  pine: { icon: TreePine, label: "Pine trees" },
  snowpeak: { icon: MountainSnow, label: "Snowy hills" },
  snow: { icon: Snowflake, label: "Snow / ice" },
  wind: { icon: Wind, label: "Wind" },
  umbrella: { icon: Umbrella, label: "Umbrella" },
  temperature: { icon: Thermometer, label: "Temperature" },
  clock: { icon: Clock, label: "Time" },
  route: { icon: Route, label: "Route" },
  signpost: { icon: Signpost, label: "Signposted" },
  pin: { icon: MapPin, label: "Meeting point" },
  compass: { icon: Compass, label: "Compass" },
  castle: { icon: Castle, label: "Castle" },
  church: { icon: Church, label: "Church" },
  landmark: { icon: Landmark, label: "Landmark" },
  shop: { icon: Store, label: "Shop" },
  shopping: { icon: ShoppingBag, label: "Shopping" },
  pizza: { icon: Pizza, label: "Takeaway" },
  icecream: { icon: IceCreamCone, label: "Ice cream" },
  pub: { icon: Beer, label: "Pub" },
  drink: { icon: CupSoda, label: "Drinks" },
  apple: { icon: Apple, label: "Snack" },
  phone: { icon: Phone, label: "Phone" },
  torch: { icon: Flashlight, label: "Torch" },
  clothing: { icon: Shirt, label: "Clothing" },
  fitness: { icon: HeartPulse, label: "Fitness" },
  firstaid: { icon: Pill, label: "First aid" },
  group: { icon: Users, label: "Group" },
  walker: { icon: PersonStanding, label: "Walker" },
  bench: { icon: Armchair, label: "Benches / seating" },
  hospital: { icon: Hospital, label: "Hospital" },
  charging: { icon: Plug, label: "Charging" },
  ticket: { icon: Ticket, label: "Ticket / entry" },
  money: { icon: PoundSterling, label: "Cost" },
  quiet: { icon: Ear, label: "Quiet" },
  views: { icon: Eye, label: "Views" },
  sunrise: { icon: Sunrise, label: "Sunrise" },
  sunset: { icon: Sunset, label: "Sunset" },
  weather: { icon: CloudSun, label: "Weather" },
  rainbow: { icon: Rainbow, label: "Rainbow" },
  warning: { icon: TriangleAlert, label: "Warning" },
  star: { icon: Star, label: "Highlight" },
  harbour: { icon: Anchor, label: "Harbour" },
  boat: { icon: Sailboat, label: "Boats" },
  farm: { icon: Tractor, label: "Farmland" },
  wildlife: { icon: Rabbit, label: "Wildlife" },
  squirrel: { icon: Squirrel, label: "Squirrels" },
  insects: { icon: Bug, label: "Insects" },
  garden: { icon: Sprout, label: "Garden" },
  muddy: { icon: Shovel, label: "Muddy" },
};

export function essentialIcon(name: string): LucideIcon {
  return ESSENTIAL_ICONS[name]?.icon ?? Info;
}

/** The original eight — kept with their original keys so walks saved
 * before the list became editable keep their ticks. */
export const DEFAULT_WALK_ESSENTIALS: EssentialItem[] = [
  { key: "toilets", icon: "toilet", label: "Toilets available" },
  { key: "parking", icon: "parking", label: "Parking" },
  { key: "cafe", icon: "coffee", label: "Café or refreshments" },
  { key: "dogs", icon: "dog", label: "Dog friendly" },
  { key: "stepFree", icon: "access", label: "Step-free / pushchair friendly" },
  { key: "bus", icon: "bus", label: "Near public transport" },
  { key: "boots", icon: "boots", label: "Walking boots recommended" },
  { key: "stiles", icon: "stiles", label: "Stiles on the route" },
];

export const MAX_WALK_ESSENTIALS = 30;
export const MAX_WALK_ESSENTIAL_LABEL = 60;

/**
 * The saved list, checked: known icons only (others fall back to Info),
 * labels trimmed and capped, no blank labels or repeated keys. Nothing
 * saved yet (null) means the defaults; a saved empty list stays empty.
 */
export function parseEssentialList(raw: unknown): EssentialItem[] {
  if (!Array.isArray(raw)) return DEFAULT_WALK_ESSENTIALS;
  const seen = new Set<string>();
  const items: EssentialItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { key, label, icon } = entry as Record<string, unknown>;
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(key) || seen.has(key)) continue;
    if (typeof label !== "string" || !label.trim()) continue;
    seen.add(key);
    items.push({
      key,
      label: label.trim().slice(0, MAX_WALK_ESSENTIAL_LABEL),
      icon: typeof icon === "string" && icon in ESSENTIAL_ICONS ? icon : "info",
    });
    if (items.length >= MAX_WALK_ESSENTIALS) break;
  }
  return items;
}

/** A walk's ticked keys that are still on the list, in the list's order, no repeats. */
export function parseWalkEssentials(raw: readonly unknown[] | null | undefined, list: EssentialItem[]): string[] {
  const picked = new Set((raw ?? []).filter((value): value is string => typeof value === "string"));
  return list.filter((item) => picked.has(item.key)).map((item) => item.key);
}

export function walkEssentialItems(keys: readonly string[] | null | undefined, list: EssentialItem[]): EssentialItem[] {
  const picked = new Set(keys ?? []);
  return list.filter((item) => picked.has(item.key));
}

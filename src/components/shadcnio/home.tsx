import { createElement } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Footprints,
  Handshake,
  Heart,
  History,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Minus,
  Mountain,
  Phone,
  ShieldCheck,
  Smartphone,
  Smile,
  Star,
  Sun,
  TreePine,
  UserPlus,
  Users,
} from "lucide-react";
import type { AboutRule } from "@/lib/homepage-copy";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { SlideView } from "@/lib/slides";
import type { TestimonialView } from "@/lib/testimonials";
import type { EssentialItem } from "@/lib/walk-essentials";
import { essentialIcon } from "@/lib/walk-essentials";
import { CARD_GRID, GALLERY_GRID, REVIEW_GRID } from "./grids";
import { BUTTON_OUTLINE, BUTTON_PRIMARY, GRID, PillLink, Section, SectionHead, Tile } from "./parts";
import type { ShadcnHomeData } from "./home-data";
import { ShadcnFaq } from "./faq";

export type ShadcnHomeProps = {
  data: ShadcnHomeData;
  siteName: string;
  tagline: string;
  logo: { src: string; width: number; height: number };
  photos: SlideView[];
  testimonials: TestimonialView[];
  faqs: FaqView[];
  faqCategories: FaqCategoryView[];
  goals: string[];
  expect: string[];
  rules: AboutRule[];
  essentials: EssentialItem[];
  facebookUrl: string;
  joinHref: string;
  signInHref: string;
};

const number = new Intl.NumberFormat("en-GB");

function photoSet(photos: SlideView[], offset: number) {
  const srcs = photos.map((photo) => photo.src);
  if (srcs.length === 0) return ["/hero.jpg"];
  return [0, 1, 2].map((i) => srcs[(offset + i) % srcs.length]!);
}

/**
 * The homepage in the shadcn.io site design: shadcn.io's homepage, section by
 * section and with their exact layout (used with their permission), filled
 * with Bury Steps' own words, walks, photos, testimonials and FAQs.
 */
export function ShadcnHome(props: ShadcnHomeProps) {
  const { data, photos } = props;
  return (
    <main aria-label="Home">
      <Hero {...props} />
      <WalksSection data={data} photos={photos} />
      <PlacesSection data={data} photos={photos} />
      <GallerySection {...props} />
      <ExpectSection expect={props.expect} photos={photos} />
      <HowItWorksSection />
      <GoalsSection goals={props.goals} />
      <RulesSection rules={props.rules} />
      <ExploreSection facebookUrl={props.facebookUrl} photos={photos} />
      <FaqTopicsSection categories={props.faqCategories} photos={photos} />
      <EssentialsSection essentials={props.essentials} />
      <MembershipSection joinHref={props.joinHref} signInHref={props.signInHref} />
      <ReviewsSection testimonials={props.testimonials} />
      <ShadcnFaq categories={props.faqCategories} faqs={props.faqs} facebookUrl={props.facebookUrl} />
      <CallToAction {...props} />
    </main>
  );
}

function Hero({ data, siteName, tagline, logo, joinHref }: ShadcnHomeProps) {
  return (
    <section aria-labelledby="home-heading" className="border-t first-of-type:border-t-0">
      <div
        className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14"
        data-slot="hero"
      >
        <div className="flex flex-col gap-4 md:gap-5 max-w-5xl mx-auto min-w-0 items-center text-center">
          <p className="text-center text-muted-foreground text-xs leading-4 mb-1 md:mb-2" data-slot="docs-affiliation">
            <span>
              {siteName} is free to join.{" "}
              <span className="max-sm:hidden">{tagline}</span>
            </span>
          </p>
          <h1
            className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
            id="home-heading"
          >
            The{" "}
            <span className="whitespace-nowrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="me-[0.18em] inline-block size-[0.82em] -translate-y-[0.05em] rounded-full border border-foreground/[0.12] object-contain bg-background align-middle"
                height={96}
                src={logo.src}
                width={96}
              />
              friendly
            </span>{" "}
            walking group that gets Bury moving.
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg md:text-xl text-balance">
            <span className="font-medium text-foreground">
              {number.format(data.upcomingCount)} walks coming up, {number.format(data.members)} members and{" "}
              {number.format(data.walksThisYear)} walks so far in {data.year}
            </span>{" "}
            in and around{" "}
            <span className="whitespace-nowrap font-medium text-foreground">
              <MapPin aria-hidden className="inline-block shrink-0 align-middle me-1 size-[1.05em] -translate-y-[0.1em]" />
              Bury
            </span>
            . Join free, then clock in on the day.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className={BUTTON_PRIMARY} href={joinHref}>
            Join the group
          </Link>
          <Link className={BUTTON_OUTLINE} href="/walks">
            See the walks
          </Link>
        </div>
      </div>
    </section>
  );
}

function WalksSection({ data, photos }: { data: ShadcnHomeData; photos: SlideView[] }) {
  return (
    <Section id="home-walks-heading">
      <SectionHead
        action={{ href: "/walks", label: "See all walks" }}
        id="home-walks-heading"
        lead={`${number.format(data.upcomingCount)} walks on the calendar,`}
        rest="each one led by a volunteer walk leader, with the meeting point, distance and grade. Members see every detail and clock in on the day."
        title="Walks coming up, every week"
      />
      <ul aria-label="Walks coming up" className={GRID}>
        {data.upcoming.map((walk, i) => (
          <Tile
            className={i >= 4 ? "max-sm:hidden" : undefined}
            href={walk.href}
            key={walk.id}
            sub={walk.detail}
            title={walk.title}
            visual={{ kind: "fan", images: photoSet(photos, i) }}
          />
        ))}
      </ul>
    </Section>
  );
}

function PlacesSection({ data, photos }: { data: ShadcnHomeData; photos: SlideView[] }) {
  return (
    <Section id="home-places-heading">
      <div className="px-5 md:px-12 py-10 text-center md:py-14">
        <h2 className="text-balance text-muted-foreground md:text-lg" id="home-places-heading">
          <span className="font-medium text-foreground">Walked by {number.format(data.members)} members</span> and across{" "}
          {data.places.length} favourite places around Bury.
        </h2>
      </div>
      <ul aria-label="Places we walk" className={GRID}>
        {data.places.map((place, i) => (
          <Tile
            key={place.name}
            sub={place.walks === 1 ? "1 walk" : `${place.walks} walks`}
            title={place.name}
            visual={{ kind: "fan", images: photoSet(photos, i + 3) }}
          />
        ))}
      </ul>
      <details className="px-5 md:px-12 border-t py-3 text-muted-foreground text-xs">
        <summary className="w-fit cursor-pointer select-none hover:text-foreground">Photos from our own walks</summary>
        <p className="mt-3">Every photo on this page was taken by members out on the paths with the group.</p>
      </details>
    </Section>
  );
}

function GallerySection({ photos, facebookUrl, joinHref }: ShadcnHomeProps) {
  return (
    <Section id="home-photos-heading">
      <SectionHead
        action={facebookUrl ? { href: facebookUrl, label: "See more on Facebook" } : undefined}
        id="home-photos-heading"
        lead="Real walks and real people,"
        rest="taken by members out on the paths in every season. Fresh air, good company and a cuppa at the end."
        title="Photos from the walks"
      />
      <ul aria-label="Photos" className={GALLERY_GRID}>
        {photos.slice(0, 8).map((photo, i) => (
          <li className={i >= 4 ? "max-sm:hidden" : ""} key={photo.id}>
            <a href={photo.src} rel="noopener noreferrer" target="_blank">
              <strong>{photo.heading || photo.alt || "On the walk"}</strong>
              <small>{photo.caption || "Bury Steps"}</small>
              <i />
              <span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" decoding="async" height={120} loading="lazy" src={photo.src} width={192} />
              </span>
              <b>Photo</b>
            </a>
          </li>
        ))}
      </ul>
      <div className="px-5 md:px-12 flex flex-col gap-4 border-t py-6 sm:flex-row sm:items-center sm:justify-between md:py-8">
        <p className="text-pretty md:text-lg">
          <span className="font-medium">Come along to the next one.</span>{" "}
          <span className="text-muted-foreground">Join free and you&apos;re ready for Sunday.</span>
        </p>
        <PillLink className="shrink-0 max-sm:w-full" href={joinHref}>
          Join the group
        </PillLink>
      </div>
    </Section>
  );
}

function ExpectSection({ expect, photos }: { expect: string[]; photos: SlideView[] }) {
  return (
    <Section id="home-expect-heading">
      <SectionHead
        id="home-expect-heading"
        lead="A friendly, welcoming group"
        rest="for every age and every pace. No pressure, no judgement, just good company on the paths."
        title="What you can expect"
      />
      <ul aria-label="What you can expect" className={GALLERY_GRID}>
        {expect.slice(0, 8).map((item, i) => (
          <li className={i >= 4 ? "max-sm:hidden" : ""} key={item}>
            <a href="#faq">
              <strong>{item}</strong>
              <small>What to expect</small>
              <i />
              <span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" decoding="async" height={120} loading="lazy" src={photoSet(photos, i + 5)[0]} width={192} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const STEPS = [
  { title: "Create an account", sub: "Email or Google, one minute", icon: <UserPlus /> },
  { title: "See the walks", sub: "Time, meeting point and map", icon: <CalendarDays /> },
  { title: "Clock in on the day", sub: "So the leader knows you're there", icon: <LogIn /> },
  { title: "Walk at your pace", sub: "Nobody gets left behind", icon: <Footprints /> },
  { title: "Clock out when done", sub: "Leaving early is fine", icon: <LogOut /> },
  { title: "Read the notices", sub: "News from the organisers", icon: <Bell /> },
  { title: "Watch the miles add up", sub: "The group's progress", icon: <BarChart3 /> },
  { title: "Look back", sub: "Every walk you've been on", icon: <History /> },
];

function HowItWorksSection() {
  return (
    <Section id="home-how-heading">
      <SectionHead
        action={{ href: "/walks", label: "See the walks" }}
        id="home-how-heading"
        lead="Join, see the walks, clock in:"
        rest="that's all there is to it. The leader knows who's out walking, and you can look back on every walk you've done."
        title="How it works"
      />
      <ul aria-label="How it works" className={GRID}>
        {STEPS.map((step, i) => (
          <Tile
            className={i >= 4 ? "max-sm:hidden" : undefined}
            key={step.title}
            sub={step.sub}
            title={step.title}
            visual={{ kind: "square", icon: step.icon }}
          />
        ))}
      </ul>
    </Section>
  );
}

const GOAL_ICONS = [<Heart key="h" />, <Mountain key="m" />, <Smile key="s" />, <Users key="u" />];

function GoalsSection({ goals }: { goals: string[] }) {
  return (
    <Section id="home-goals-heading">
      <SectionHead
        id="home-goals-heading"
        lead="Fitter, happier and less alone,"
        rest="at whatever pace suits you. Members walk to get moving again, to feel better and to make friends."
        title="More than just a walking group"
      />
      <ul aria-label="Group goals" className={GRID}>
        {goals.slice(0, 4).map((goal, i) => (
          <Tile key={goal} sub="A reason to walk" title={goal} visual={{ kind: "circle", icon: GOAL_ICONS[i % 4] }} />
        ))}
      </ul>
    </Section>
  );
}

const RULE_ICONS = [
  [<ShieldCheck key="a" />, <Users key="b" />, <Heart key="c" />],
  [<Clock key="a" />, <Footprints key="b" />, <Sun key="c" />],
  [<Phone key="a" />, <Bell key="b" />, <Mail key="c" />],
  [<TreePine key="a" />, <Compass key="b" />, <MapPin key="c" />],
];

function RulesSection({ rules }: { rules: AboutRule[] }) {
  return (
    <Section id="home-rules-heading">
      <SectionHead
        id="home-rules-heading"
        lead={`${rules.length} simple rules`}
        rest="that keep every walk safe, kind and enjoyable for everyone in the group."
        title="Group rules"
      />
      <ul
        aria-label="Group rules"
        className="grid border-t [clip-path:inset(1px_0_0_1px)] *:border-t *:border-l grid-cols-2 lg:grid-cols-4"
      >
        {rules.slice(0, 8).map((rule, i) => (
          <Tile
            className={i >= 4 ? "max-sm:hidden" : undefined}
            key={rule.title}
            sub={rule.body}
            title={rule.title}
            visual={{ kind: "stack", icons: RULE_ICONS[i % RULE_ICONS.length]! }}
          />
        ))}
      </ul>
    </Section>
  );
}

function ExploreSection({ facebookUrl, photos }: { facebookUrl: string; photos: SlideView[] }) {
  const pages = [
    { href: "/walks", title: "Walks", sub: "Coming up" },
    { href: "/notices", title: "Notices", sub: "News" },
    { href: "/progress", title: "Progress", sub: "The group's miles" },
    { href: "/history", title: "Your history", sub: "Walks you've done" },
    { href: "/contact", title: "Contact us", sub: "Ask a question" },
    { href: "/apps", title: "Walking apps", sub: "Apps we like" },
    ...(facebookUrl ? [{ href: facebookUrl, title: "Facebook group", sub: "Chat with members" }] : []),
    { href: "/email-preferences", title: "Email preferences", sub: "Choose your emails" },
  ].slice(0, 8);
  return (
    <Section id="home-explore-heading">
      <SectionHead
        action={{ href: "/walks", label: "Start exploring" }}
        id="home-explore-heading"
        lead="Everything in one place:"
        rest="the walks, the notices, the group's progress and your own walk history. Free with an account."
        title="Explore the site"
      />
      <ul aria-label="Pages" className={CARD_GRID}>
        {pages.map((page, i) => (
          <li className={i >= 4 ? "max-sm:hidden" : ""} key={page.title}>
            {page.href.startsWith("http") ? (
              <a href={page.href} rel="noopener noreferrer" target="_blank">
                <strong>{page.title}</strong>
                <small>{page.sub}</small>
                <i />
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" decoding="async" height={120} loading="lazy" src={photoSet(photos, i + 2)[0]} width={192} />
                </span>
              </a>
            ) : (
              <Link href={page.href}>
                <strong>{page.title}</strong>
                <small>{page.sub}</small>
                <i />
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" decoding="async" height={120} loading="lazy" src={photoSet(photos, i + 2)[0]} width={192} />
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function FaqTopicsSection({ categories, photos }: { categories: FaqCategoryView[]; photos: SlideView[] }) {
  const total = categories.reduce((sum, category) => sum + category.faqCount, 0);
  return (
    <Section id="home-topics-heading">
      <SectionHead
        action={{ href: "#faq", label: "Read the answers" }}
        id="home-topics-heading"
        lead={`${total} questions, answered,`}
        rest="from joining and what to bring to how clock-in works. Still unsure? Ask us any time."
        title="Questions people ask"
      />
      <ul aria-label="Question topics" className={GRID}>
        {categories.slice(0, 8).map((category, i) => (
          <Tile
            className={i >= 4 ? "max-sm:hidden" : undefined}
            href="#faq"
            key={category.id}
            sub={category.faqCount === 1 ? "1 question" : `${category.faqCount} questions`}
            title={category.label}
            visual={{ kind: "fan", images: photoSet(photos, i + 1) }}
          />
        ))}
      </ul>
    </Section>
  );
}

function EssentialsSection({ essentials }: { essentials: EssentialItem[] }) {
  return (
    <Section id="home-essentials-heading">
      <SectionHead
        id="home-essentials-heading"
        lead="Toilets, parking, cafés and more:"
        rest="each walk shows what's at the meeting point, so you know before you set off."
        title="Know before you go"
      />
      <ul aria-label="Walk essentials" className={CARD_GRID}>
        {essentials.slice(0, 8).map((item, i) => (
          <li className={i >= 4 ? "max-sm:hidden" : ""} key={item.key}>
            <Link href="/walks">
              <strong>{item.label}</strong>
              <small>On the walk page</small>
              <i />
              <span>
                <span className="flex size-full items-center justify-center text-foreground/80 [&_svg]:size-10 [&_svg]:stroke-[1.25]">
                  {createElement(essentialIcon(item.icon), { "aria-hidden": true })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const PLANS = [
  {
    name: "Visitor",
    note: "Have a look around first",
    cta: { label: "Sign in", variant: "outline" as const },
    small: "No account needed to browse",
    values: ["Homepage and photos", "—", "—", "—", "—", "—", "—", "—"],
  },
  {
    name: "Member",
    note: "For everyone who walks with us",
    badge: "Most people",
    cta: { label: "Join the group", variant: "primary" as const },
    small: "Free, always · no card needed",
    values: ["Every walk", "Map and directions", "On the day", "Your own record", "Email or phone", "The group's miles", "—", "—"],
  },
  {
    name: "Walk leader",
    note: "Volunteers who lead the way",
    cta: { label: "Ask to lead", variant: "outline" as const },
    small: "Ask an organiser",
    values: ["Every walk", "Map and directions", "On the day", "Your own record", "Email or phone", "The group's miles", "Lead and back-mark", "Who's on your walk"],
  },
];
const FEATURES = [
  { label: "Walks coming up", icon: CalendarDays },
  { label: "Meeting points", icon: MapPin },
  { label: "Clock in", icon: LogIn },
  { label: "Walk history", icon: History },
  { label: "Notices", icon: Bell },
  { label: "Group progress", icon: BarChart3 },
  { label: "Leading walks", icon: Handshake },
  { label: "Walk register", icon: Smartphone },
];

function PlanValue({ value }: { value: string }) {
  return value === "—" ? (
    <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Minus aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      Not included
    </span>
  ) : (
    <span className="flex items-center gap-2.5 text-sm font-medium">
      <Check aria-hidden className="size-4 shrink-0 text-primary" />
      {value}
    </span>
  );
}

function MembershipSection({ joinHref, signInHref }: { joinHref: string; signInHref: string }) {
  const href = (label: string) => (label === "Join the group" ? joinHref : label === "Sign in" ? signInHref : "/contact");
  const price = (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-medium tracking-tighter">
      <span className="text-5xl tabular-nums lg:text-4xl xl:text-5xl">£0</span>
      <span className="text-muted-foreground text-xl tracking-tight">/forever</span>
    </p>
  );
  return (
    <Section id="home-membership-heading">
      <SectionHead
        action={{ href: joinHref, label: "Join free" }}
        id="home-membership-heading"
        lead="Every walk, the notices, clock-in and your walk history,"
        rest="free for every member. Volunteers lead the walks; organisers keep it all running."
        title="Free to join, free to walk"
      />
      <div className="scroll-mt-(--header-height)" id="plans">
        <div className="bg-muted/60 flex items-center justify-center gap-x-2 gap-y-2 border-t px-4 py-2.5 text-sm max-sm:justify-between sm:flex-wrap sm:gap-x-3 sm:px-5 sm:py-3">
          <span aria-hidden="true" className="flex items-center gap-0.5 text-primary max-sm:hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star className="size-3.5 fill-current" key={i} />
            ))}
          </span>
          <p className="min-w-0 max-sm:truncate">
            <span className="font-medium">No subscription, no card</span>{" "}
            <span className="text-muted-foreground">and no catch. Just come and walk.</span>
          </p>
        </div>
        {/* Computers: the four columns side by side, as on shadcn.io. */}
        <div className="hidden grid-cols-4 grid-rows-[auto_auto] divide-x border-t lg:grid">
          <div className="row-span-2 grid grid-rows-subgrid">
            <div className="flex min-h-[19rem] flex-col p-6">
              <div className="flex flex-1 flex-col justify-between gap-8">
                <div className="flex flex-col gap-2">
                  <p className="flex min-h-6 items-center font-medium text-lg tracking-tight">Joining</p>
                  <p className="text-balance text-muted-foreground text-sm leading-relaxed lg:min-h-[2lh]">
                    Free for everyone. Sign up with email or Google.
                  </p>
                </div>
                <ul className="w-full divide-y border-t">
                  {[
                    ["Members", "Free"],
                    ["Walk leaders", "Volunteers"],
                    ["Organisers", "By invite"],
                  ].map(([label, tag], i) => (
                    <li
                      className={`flex h-11 items-center gap-3 text-sm ${i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                      key={label}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${i === 0 ? "border-primary" : ""}`}
                      >
                        {i === 0 ? <span className="size-2 rounded-full bg-primary" /> : null}
                      </span>
                      <span className="flex-1">{label}</span>
                      <span className="font-normal text-muted-foreground text-xs">{tag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <ul className="mx-6 divide-y border-t">
              {FEATURES.map(({ label, icon: Icon }) => (
                <li className="flex min-h-14 items-center" key={label}>
                  <span className="group relative flex min-w-0 flex-1 items-center gap-2.5 self-stretch font-medium text-sm">
                    <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="min-w-0">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {PLANS.map((plan) => (
            <div className="row-span-2 grid grid-rows-subgrid" key={plan.name}>
              <div className="flex min-h-[19rem] flex-col p-6">
                <div className="flex flex-1 flex-col justify-between gap-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex min-h-6 items-center justify-between gap-3">
                      <h3 className="font-medium text-lg tracking-tight">{plan.name}</h3>
                      {plan.badge ? (
                        <span className="inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium">{plan.badge}</span>
                      ) : null}
                    </div>
                    <p className="text-balance text-muted-foreground text-sm leading-relaxed lg:min-h-[2lh]">{plan.note}</p>
                    {price}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      className={`${plan.cta.variant === "primary" ? BUTTON_PRIMARY : BUTTON_OUTLINE} w-full px-4`}
                      href={href(plan.cta.label)}
                    >
                      {plan.cta.label}
                    </Link>
                    <p className="text-center font-medium text-muted-foreground text-xs">{plan.small}</p>
                  </div>
                </div>
              </div>
              <ul aria-label={`${plan.name} includes`} className="mx-6 divide-y border-t">
                {plan.values.map((value, i) => (
                  <li className="flex min-h-14 items-center" key={FEATURES[i]!.label}>
                    <span className="sr-only">{FEATURES[i]!.label}: </span>
                    <PlanValue value={value} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Phones and tablets: one plan under another. */}
        <div className="divide-y border-t lg:hidden">
          {PLANS.map((plan) => (
            <div className="flex flex-col gap-4 p-5" key={plan.name}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-lg tracking-tight">{plan.name}</h3>
                {plan.badge ? (
                  <span className="inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium">{plan.badge}</span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">{plan.note}</p>
              {price}
              <Link
                className={`${plan.cta.variant === "primary" ? BUTTON_PRIMARY : BUTTON_OUTLINE} w-full px-4`}
                href={href(plan.cta.label)}
              >
                {plan.cta.label}
              </Link>
              <ul className="divide-y border-t">
                {plan.values.map((value, i) => (
                  <li className="flex min-h-12 items-center justify-between gap-3" key={FEATURES[i]!.label}>
                    <span className="text-sm text-muted-foreground">{FEATURES[i]!.label}</span>
                    <PlanValue value={value} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ReviewsSection({ testimonials }: { testimonials: TestimonialView[] }) {
  if (testimonials.length === 0) return null;
  return (
    <Section id="home-reviews-heading">
      <SectionHead
        id="home-reviews-heading"
        lead="Members love walking with us."
        rest="Here's what a few of them say about the group, the walks and the people."
        title="From the group"
      />
      <ul aria-label="What members say" className={REVIEW_GRID}>
        {testimonials.slice(0, 8).map((review, i) => (
          <li className={i >= 4 ? "max-sm:hidden" : ""} key={review.id}>
            <a className="group" href="#faq">
              <strong>{review.name}</strong>
              <small>{review.role}</small>
              <blockquote className="relative z-10 mt-3 min-h-0 flex-1 text-pretty text-muted-foreground text-sm leading-5 transition-[color] group-hover:text-foreground group-focus-visible:text-foreground duration-300 ease-out motion-reduce:transition-none">
                <span aria-hidden="true" className="float-end h-[calc(100%-5.25rem)] w-px" />
                <span
                  aria-hidden="true"
                  className="float-end clear-end size-21 [shape-outside:circle(4rem_at_4rem_4rem)] rtl:[shape-outside:circle(4rem_at_1.25rem_4rem)]"
                />
                <p>“{review.quote}”</p>
              </blockquote>
              <i />
              <span aria-hidden="true">
                {review.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" decoding="async" height={48} loading="lazy" src={review.image} width={48} />
                ) : (
                  <span>{review.name.charAt(0)}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function CallToAction({ data, joinHref, testimonials }: ShadcnHomeProps) {
  return (
    <Section className="relative isolate overflow-hidden" id="home-cta-heading">
      <div className="px-5 md:px-12 flex flex-col items-center py-20 text-center md:py-28">
        <div className="flex max-w-2xl flex-col items-center gap-5 md:px-10">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <span aria-hidden="true" className="flex -space-x-1.5">
              {testimonials.slice(0, 4).map((review) =>
                review.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-6 rounded-full object-cover object-top ring-2 ring-background"
                    height={24}
                    key={review.id}
                    loading="lazy"
                    src={review.image}
                    width={24}
                  />
                ) : (
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium ring-2 ring-background"
                    key={review.id}
                  >
                    {review.name.charAt(0)}
                  </span>
                ),
              )}
            </span>
            <span aria-hidden="true" className="flex items-center gap-0.5 text-primary">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star className="size-3.5 fill-current" key={i} />
              ))}
            </span>
            <span>
              <span className="font-medium">{number.format(data.members)} members</span>{" "}
              <span className="text-muted-foreground">and counting</span>
            </span>
          </p>
          <h2
            className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter md:text-5xl lg:text-6xl"
            id="home-cta-heading"
          >
            Come for a walk this week
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground md:text-lg">
            <span className="font-medium text-foreground">Joining is free.</span> Make an account, pick a walk and meet us
            there. Walk at your own pace; nobody gets left behind.
          </p>
          <Link className={`${BUTTON_PRIMARY} mt-4 h-12 gap-2 px-8 text-base`} href={joinHref}>
            Join the group
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

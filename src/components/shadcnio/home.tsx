import { Fragment, createElement } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Footprints,
  Handshake,
  Heart,
  History,
  LogIn,
  LogOut,
  MapPin,
  Mountain,
  ShieldCheck,
  Smile,
  Star,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { TestimonialView } from "@/lib/testimonials";
import { GALLERY_GRID_3, PHONE_LIST } from "./grids";
import { SectionTitle } from "@/components/section-title";
import { BUTTON_OUTLINE, BUTTON_PRIMARY, PillLink, WALKS_GRID, MiniNote, MiniWalk, Section, SectionHead, Tile } from "./parts";
import type { ShadcnHomeData } from "./home-data";
import { ShadcnFaq } from "./faq";
import { ShadcnReviews } from "./reviews";
import { MoreRows } from "./more-rows";
import { BandField, HeroField } from "./ascii-field";

export type ShadcnHomeProps = {
  data: ShadcnHomeData;
  siteName: string;
  tagline: string;
  logo: { src: string; width: number; height: number };
  testimonials: TestimonialView[];
  faqs: FaqView[];
  faqCategories: FaqCategoryView[];
  goals: string[];
  expect: string[];
  facebookUrl: string;
  joinHref: string;
  signInHref: string;
  /** Homepage teaser; full story is on /about. */
  about: { title: string; teaser: string };
};

const number = new Intl.NumberFormat("en-GB");

export function ShadcnHome(props: ShadcnHomeProps) {
  const { data } = props;
  return (
    <main aria-label="Home">
      <Hero {...props} />
      <AboutSection about={props.about} />
      <WalksSection data={data} />
      <ExpectSection expect={props.expect} />
      <HowItWorksSection />
      <GoalsSection goals={props.goals} />
      <ReviewsSection testimonials={props.testimonials} />
      <ShadcnFaq categories={props.faqCategories} faqs={props.faqs} facebookUrl={props.facebookUrl} />
      <CallToAction {...props} />
    </main>
  );
}

/** A walk's place as a short name: "MOSES GATE COUNTRY PARK CARPARK" becomes "Moses Gate Country Park". */
function tidyPlace(name: string) {
  const words = name
    .replace(/\b(car ?park|parking)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const shouting = name === name.toUpperCase();
  return words.map((word) => (shouting ? word.charAt(0) + word.slice(1).toLowerCase() : word)).join(" ");
}

function Hero({ data, logo, joinHref }: ShadcnHomeProps) {
  // Four places, as they list four frameworks; Bury first.
  const places = [
    "Bury",
    ...data.places
      .map((place) => tidyPlace(place.name))
      // Short names only, so the line keeps their three-line shape.
      .filter((name) => name.length >= 3 && name.length <= 14 && !/^(bury|test)\b/i.test(name) && /[aeiou]/i.test(name)),
  ]
    .filter((name, i, all) => all.indexOf(name) === i)
    .slice(0, 4);
  return (
    <section aria-labelledby="home-heading" className="border-t first-of-type:border-t-0">
      <div
        className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14"
        data-slot="hero"
      >
        <HeroField heading="home-heading" />
        <div className="flex flex-col gap-4 md:gap-5 max-w-5xl mx-auto min-w-0 items-center text-center">
          <p className="text-center text-muted-foreground text-xs leading-4 mb-1 md:mb-2" data-slot="docs-affiliation">
            {/* Same length and shape as theirs ("shadcn.io is an independent project built on shadcn/ui"). */}
            <span>
              Bury Steps is a free, friendly walking group from{" "}
              <a
                className="text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors hover:decoration-foreground"
                href="#home-about-heading"
              >
                Bury
              </a>
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
              walking
            </span>{" "}
            group
            {/* Two lines on wider screens, split where theirs is. */}
            <br className="max-sm:hidden" /> all of Bury steps out with.
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg md:text-xl text-balance">
            <span className="font-medium text-foreground">
              {number.format(data.upcomingCount)} upcoming walks, {number.format(data.members)} members and{" "}
              {number.format(data.walksThisYear)} walks so far
            </span>{" "}
            around{" "}
            {places.map((place, i) => (
              <Fragment key={place}>
                <span className="whitespace-nowrap font-medium text-foreground">
                  <MapPin aria-hidden className="inline-block shrink-0 align-middle me-1 size-[1.05em] -translate-y-[0.1em]" />
                  {place}
                </span>
                {i < places.length - 2 ? ", " : i === places.length - 2 ? " and " : ""}
              </Fragment>
            ))}
            .{" "}
            {/* Visitors are asked to join; signed-in members (marked before the page paints) get their own line. */}
            <span data-guest-home="">Join for free, and clock in on the day of the walk.</span>
            <span data-member-home="">Pick your next walk, and clock in when you get there.</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className={BUTTON_PRIMARY} data-guest-home="" href={joinHref}>
            Join the group
          </Link>
          <Link className={BUTTON_PRIMARY} data-member-home="" href="/overview">
            Your dashboard
          </Link>
          <Link className={BUTTON_OUTLINE} href="/walks">
            See the walks
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The group's story teaser; Read more opens the full About page. */
function AboutSection({ about }: { about: ShadcnHomeProps["about"] }) {
  const [lead, ...rest] = about.teaser.split(/(?<=[.!?])\s+/);
  return (
    <Section id="home-about-heading">
      <div className="px-5 md:px-12 flex flex-col items-center gap-5 py-12 text-center md:py-16">
        <div className="mx-auto flex max-w-2xl min-w-0 flex-col items-center gap-3 lg:gap-4">
          <SectionTitle
            className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl"
            id="home-about-heading"
            text={about.title}
          />
          <p className="text-pretty text-muted-foreground md:text-lg">
            <span className="font-medium text-foreground">{lead}</span> {rest.join(" ")}
          </p>
        </div>
        <div className="flex shrink-0 justify-center gap-2">
          <PillLink arrow href="/about">
            Read more
          </PillLink>
        </div>
      </div>
    </Section>
  );
}

function WalksSection({ data }: { data: ShadcnHomeData }) {
  return (
    <Section id="home-walks-heading">
      <SectionHead
        action={{ href: "/walks", label: "See all walks" }}
        id="home-walks-heading"
        lead={`${number.format(data.upcomingCount)} walks on the calendar,`}
        rest="each one led by a volunteer walk leader, with the meeting point, distance and grade. Members see every detail and clock in on the day."
        title="Walks coming up, every week"
      />
      <MoreRows className={WALKS_GRID} columns={3} first={3} label="Walks coming up">
        {data.upcoming.slice(0, 6).map((walk, i, shownWalks) => (
          <Tile
            href={walk.href}
            key={walk.id}
            sub={walk.detail}
            title={walk.title}
            visual={{
              kind: "fan",
              cards: [2, 1, 0].map((k) => {
                const shown = shownWalks[(i + k) % shownWalks.length]!;
                return <MiniWalk detail={shown.detail.split(" · ").slice(1).join(" · ")} key={k} title={shown.title} when={shown.when} />;
              }),
            }}
          />
        ))}
      </MoreRows>
    </Section>
  );
}

const EXPECT_ICONS = [Smile, Users, Heart, Footprints, ShieldCheck, Sun, Handshake, Mountain];

function ExpectSection({ expect }: { expect: string[] }) {
  return (
    <Section id="home-expect-heading">
      <SectionHead
        id="home-expect-heading"
        lead="A friendly, welcoming group"
        rest="for every age and every pace. No pressure, no judgement, just good company on the paths."
        title="What you can expect"
      />
      <MoreRows className={`${GALLERY_GRID_3} ${PHONE_LIST}`} columns={3} first={3} label="What you can expect">
        {expect.slice(0, 6).map((item, i) => (
          <li key={item}>
            <a href="#faq">
              <strong>{item}</strong>
              <small>What to expect</small>
              <i />
              <span>
                <MiniNote icon={createElement(EXPECT_ICONS[i % EXPECT_ICONS.length]!, { "aria-hidden": true })} text={item} />
              </span>
            </a>
          </li>
        ))}
      </MoreRows>
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

/** Visitors only — signed-in members already know the flow (data-guest-home). */
function HowItWorksSection() {
  return (
    <div data-guest-home="">
      <Section id="home-how-heading">
        <SectionHead
          action={{ href: "/walks", label: "See the walks" }}
          id="home-how-heading"
          lead="Join, see the walks, clock in:"
          rest="that's all there is to it. The leader knows who's out walking, and you can look back on every walk you've done."
          title="How it works"
        />
        <MoreRows className={WALKS_GRID} columns={3} first={3} label="How it works">
          {STEPS.slice(0, 6).map((step) => (
            <Tile
              key={step.title}
              phoneRow
              sub={step.sub}
              title={step.title}
              visual={{ kind: "square", icon: step.icon }}
            />
          ))}
        </MoreRows>
      </Section>
    </div>
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
      <MoreRows className={WALKS_GRID} columns={3} first={3} label="Group goals">
        {goals.slice(0, 6).map((goal, i) => (
          <Tile key={goal} phoneRow sub="A reason to walk" title={goal} visual={{ kind: "circle", icon: GOAL_ICONS[i % 4] }} />
        ))}
      </MoreRows>
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
      <ShadcnReviews testimonials={testimonials} />
    </Section>
  );
}

function CallToAction({ data, joinHref, testimonials }: ShadcnHomeProps) {
  return (
    <Section
      className="relative isolate overflow-hidden [&>canvas]:[mask-image:radial-gradient(ellipse_50%_62%_at_50%_50%,#000_55%,transparent_100%)]"
      id="home-cta-heading"
    >
      <BandField heading="home-cta-heading" />
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
            <span data-guest-home="">
              <span className="font-medium text-foreground">Joining is free.</span> Make an account, pick a walk and meet us
              there. Walk at your own pace; nobody gets left behind.
            </span>
            <span data-member-home="">
              <span className="font-medium text-foreground">Your next walk is waiting.</span> Pick one, meet us there and
              clock in on the day. Walk at your own pace; nobody gets left behind.
            </span>
          </p>
          <Link className={`${BUTTON_PRIMARY} mt-4 h-12 gap-2 px-8 text-base`} data-guest-home="" href={joinHref}>
            Join the group
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
          <Link className={`${BUTTON_PRIMARY} mt-4 h-12 gap-2 px-8 text-base`} data-member-home="" href="/walks">
            See the walks
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

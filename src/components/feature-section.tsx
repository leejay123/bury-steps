import type React from "react";
import { cn } from "@/lib/utils";

type FeatureType = {
  title: string;
  description: string;
  illustration: React.ReactNode;
};

function Bar({ className }: { className?: string }) {
  return <div className={cn("h-2 rounded-full bg-muted-foreground/15", className)} />;
}

function SignUpSketch() {
  return (
    <div className="flex w-40 flex-col gap-2 rounded-lg border bg-background p-3 shadow-xs">
      <Bar className="w-1/2" />
      <div className="h-5 rounded-md border" />
      <div className="h-5 rounded-md border" />
      <div className="h-5 rounded-md bg-foreground/80" />
    </div>
  );
}

function CalendarSketch() {
  return (
    <div className="grid w-40 grid-cols-7 gap-1 rounded-lg border bg-background p-3 shadow-xs">
      {Array.from({ length: 21 }, (_, index) => (
        <div
          className={cn(
            "aspect-square rounded-[3px] bg-muted-foreground/10",
            index === 13 && "bg-foreground/80",
          )}
          key={index}
        />
      ))}
    </div>
  );
}

function ClockInSketch() {
  return (
    <div className="flex w-40 items-center gap-3 rounded-lg border bg-background p-3 shadow-xs">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/80">
        <svg aria-hidden className="size-3.5 text-background" fill="none" viewBox="0 0 16 16">
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Bar className="w-3/4" />
        <Bar className="w-1/2" />
      </div>
    </div>
  );
}

const features: FeatureType[] = [
  {
    title: "Create an account",
    description: "Sign up with email or Google so we know who is on the walk.",
    illustration: <SignUpSketch />,
  },
  {
    title: "See upcoming walks",
    description: "Members get the time, meeting point, and a link to clock in.",
    illustration: <CalendarSketch />,
  },
  {
    title: "Clock in on the day",
    description: "When you arrive, clock in so the walk leader knows you are there.",
    illustration: <ClockInSketch />,
  },
];

export function FeatureSection() {
  return (
    <div className="flex flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">How walks work</h2>
        <p className="text-muted-foreground">Three small steps between you and Sunday’s walk.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((feature, index) => (
          <div
            className="flex flex-col overflow-hidden rounded-xl border bg-background"
            key={feature.title}
          >
            <div className="flex h-40 items-center justify-center border-b bg-muted/40">
              {feature.illustration}
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
              <h3 className="font-medium text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

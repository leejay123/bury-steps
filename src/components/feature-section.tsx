"use client";

import { CalendarDays, Footprints, UserPlus } from "lucide-react";
import type React from "react";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

type FeatureType = {
  title: string;
  icon: React.ReactNode;
  description: string;
};

const features: FeatureType[] = [
  {
    title: "Create an account",
    icon: <UserPlus />,
    description: "Sign up with email or Google so we know who is on the walk.",
  },
  {
    title: "See upcoming walks",
    icon: <CalendarDays />,
    description: "Members get the time, meeting point, and a link to clock in.",
  },
  {
    title: "Clock in on the day",
    icon: <Footprints />,
    description: "When you arrive, clock in so the walk leader knows you are there.",
  },
];

export function FeatureSection() {
  return (
    <div className="relative w-full">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <Stagger className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {features.map((feature) => (
          <StaggerItem className="h-full" key={feature.title}>
            <FeatureCard className="h-full" feature={feature} />
          </StaggerItem>
        ))}
      </Stagger>
      <FullWidthDivider position="bottom" />
    </div>
  );
}

export function FeatureCard({
  feature,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  feature: FeatureType;
}) {
  return (
    <div
      className={cn("relative flex flex-col justify-between bg-background p-6 md:p-8", className)}
      {...props}
    >
      <div className={cn("relative z-10 flex items-center pt-2 pb-5", "[&_svg]:size-5 [&_svg]:text-primary")}>
        {feature.icon}
      </div>
      <div className="relative z-10 space-y-2">
        <h3 className="text-lg font-medium text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}

"use client";

import type { ComponentProps } from "react";
import { ArrowRight } from "lucide-react";
import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { BUTTON_PRIMARY } from "./parts";

/**
 * The About drawer behind a shadcn.io pill button. The button is made here, in
 * the browser's code, so the drawer can use it as its own trigger (one button,
 * not a button inside a button).
 */
export function AboutReadMore(props: Omit<ComponentProps<typeof HomeAboutDrawer>, "trigger">) {
  return (
    <HomeAboutDrawer
      {...props}
      trigger={
        <button className={`${BUTTON_PRIMARY} gap-2`} type="button">
          Read more
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </button>
      }
    />
  );
}

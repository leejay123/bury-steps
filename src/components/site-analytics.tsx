"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { telemetryBeforeSend } from "@/lib/analytics-before-send";

/** Client wrapper so both Vercel scripts can drop capability-token URLs. */
export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={telemetryBeforeSend} />
      <SpeedInsights beforeSend={telemetryBeforeSend} />
    </>
  );
}

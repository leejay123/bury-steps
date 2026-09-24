"use client";

import { Analytics } from "@vercel/analytics/next";
import { analyticsBeforeSend } from "@/lib/analytics-before-send";

/** Client wrapper so `beforeSend` can redact capability-token URLs. */
export function SiteAnalytics() {
  return <Analytics beforeSend={analyticsBeforeSend} />;
}

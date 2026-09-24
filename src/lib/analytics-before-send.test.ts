import { describe, expect, it } from "vitest";
import { redactCapabilityAnalyticsEvent } from "./analytics-before-send";

describe("redactCapabilityAnalyticsEvent", () => {
  it("drops organiser-invite, email-preferences, and walk-share paths", () => {
    expect(
      redactCapabilityAnalyticsEvent({
        type: "pageview",
        url: "https://example.com/organiser-invite/abc123",
      }),
    ).toBeNull();
    expect(
      redactCapabilityAnalyticsEvent({
        type: "pageview",
        url: "/email-preferences/tok",
      }),
    ).toBeNull();
    expect(
      redactCapabilityAnalyticsEvent({
        type: "pageview",
        url: "/email-preferences/newsletter/tok",
      }),
    ).toBeNull();
    expect(
      redactCapabilityAnalyticsEvent({
        type: "pageview",
        url: "https://example.com/w/burrs-x7k2m9",
      }),
    ).toBeNull();
  });

  it("keeps ordinary public and signed-in paths", () => {
    const event = { type: "pageview" as const, url: "https://example.com/walks" };
    expect(redactCapabilityAnalyticsEvent(event)).toEqual(event);
    expect(
      redactCapabilityAnalyticsEvent({ type: "pageview", url: "/contact" }),
    ).toEqual({ type: "pageview", url: "/contact" });
  });
});

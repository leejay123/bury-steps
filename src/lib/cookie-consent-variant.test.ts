import { describe, expect, it } from "vitest";
import {
  DEFAULT_COOKIE_CONSENT_VARIANT,
  parseCookieConsentVariant,
} from "@/lib/cookie-consent-variant";

describe("parseCookieConsentVariant", () => {
  it("accepts the shadcn layouts", () => {
    expect(parseCookieConsentVariant("default")).toBe("default");
    expect(parseCookieConsentVariant("small")).toBe("small");
    expect(parseCookieConsentVariant("mini")).toBe("mini");
  });

  it("rejects unknown values", () => {
    expect(parseCookieConsentVariant("large")).toBeNull();
    expect(parseCookieConsentVariant("")).toBeNull();
  });

  it("defaults to small", () => {
    expect(DEFAULT_COOKIE_CONSENT_VARIANT).toBe("small");
  });
});

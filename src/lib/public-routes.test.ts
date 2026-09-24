import { describe, expect, it } from "vitest";
import { PUBLIC_ROUTE_PATTERNS, isTokenPublicPath } from "./public-routes";

describe("PUBLIC_ROUTE_PATTERNS", () => {
  it("keeps email-preference and organiser-invite token links public", () => {
    expect(PUBLIC_ROUTE_PATTERNS).toContain("/email-preferences/(.*)");
    expect(PUBLIC_ROUTE_PATTERNS).toContain("/organiser-invite/(.*)");
  });

  it("does not accidentally make the signed-in preferences hub public", () => {
    // Exact /email-preferences (no trailing segment) is the account-menu
    // page and must still require sign-in. Only the tokenised child routes
    // are public.
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain("/email-preferences");
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain("/email-preferences(.*)");
  });
});

describe("isTokenPublicPath", () => {
  it("matches tokenised preference and invite URLs", () => {
    expect(isTokenPublicPath("/email-preferences/abc123")).toBe(true);
    expect(isTokenPublicPath("/email-preferences/newsletter/abc123")).toBe(true);
    expect(isTokenPublicPath("/organiser-invite/abc123")).toBe(true);
  });

  it("rejects the signed-in preferences hub and unrelated paths", () => {
    expect(isTokenPublicPath("/email-preferences")).toBe(false);
    expect(isTokenPublicPath("/email-preferences/")).toBe(false);
    expect(isTokenPublicPath("/organiser-invite")).toBe(false);
    expect(isTokenPublicPath("/walks")).toBe(false);
  });
});

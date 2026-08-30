import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  accountPortalHref,
  appUrl,
  clerkAuthorizedParties,
  isTrustedAppUrl,
  PRODUCTION_APP_URL,
  safeAppPath,
  shouldProxyClerkFrontendApi,
} from "./urls";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

describe("isTrustedAppUrl", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("trusts the production origin", () => {
    expect(isTrustedAppUrl(`${PRODUCTION_APP_URL}/dashboard`)).toBe(true);
  });

  it("trusts the www variant of the production origin", () => {
    expect(isTrustedAppUrl("https://www.burysteps-walkinggroup.co.uk/dashboard")).toBe(true);
  });

  it("rejects an attacker-controlled host used for an open redirect", () => {
    expect(isTrustedAppUrl("https://evil.example.com/dashboard")).toBe(false);
  });

  it("rejects a host that merely starts with the trusted domain", () => {
    expect(isTrustedAppUrl("https://burysteps-walkinggroup.co.uk.evil.com/")).toBe(false);
  });

  it("rejects non-http(s) protocols", () => {
    expect(isTrustedAppUrl("javascript:alert(1)")).toBe(false);
    expect(isTrustedAppUrl(`data:text/html,<script>alert(1)</script>`)).toBe(false);
  });

  it("rejects credentials embedded in the URL", () => {
    expect(isTrustedAppUrl(`https://user:pass@${new URL(PRODUCTION_APP_URL).host}/`)).toBe(false);
  });

  it("rejects malformed input rather than throwing", () => {
    expect(isTrustedAppUrl("not a url at all")).toBe(false);
  });
});

describe("safeAppPath", () => {
  it("allows ordinary in-app paths", () => {
    expect(safeAppPath("/admin/members")).toBe("/admin/members");
    expect(safeAppPath("/admin?tab=1#x")).toBe("/admin?tab=1#x");
  });

  it("rejects protocol-relative and scheme-smuggling redirects", () => {
    expect(safeAppPath("//evil.example")).toBeUndefined();
    expect(safeAppPath("/\\evil.example")).toBeUndefined();
    expect(safeAppPath("https://evil.example")).toBeUndefined();
  });
});

describe("appUrl", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("prefers an explicit NEXT_PUBLIC_APP_URL override", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test/";
    expect(appUrl()).toBe("https://example.test");
  });

  it("uses the production URL when VERCEL_ENV is production", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = "production";
    expect(appUrl()).toBe(PRODUCTION_APP_URL);
  });

  it("falls back to localhost outside of Vercel", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    expect(appUrl()).toBe("http://localhost:3000");
  });
});

describe("shouldProxyClerkFrontendApi", () => {
  it("proxies only Vercel Preview hosts", () => {
    expect(shouldProxyClerkFrontendApi("bury-steps-git-main.vercel.app", "preview")).toBe(true);
    expect(shouldProxyClerkFrontendApi("bury-steps-abc123.vercel.app", "production")).toBe(false);
    expect(shouldProxyClerkFrontendApi("burysteps-walkinggroup.co.uk", "preview")).toBe(false);
    expect(shouldProxyClerkFrontendApi("burysteps-walkinggroup.co.uk", "production")).toBe(false);
  });
});

describe("clerkAuthorizedParties", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("always includes the live site", () => {
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(clerkAuthorizedParties()).toEqual(
      expect.arrayContaining([
        PRODUCTION_APP_URL,
        "https://www.burysteps-walkinggroup.co.uk",
      ]),
    );
  });

  it("includes this deploy's Vercel URL when present", () => {
    process.env.VERCEL_URL = "bury-steps-abc123.vercel.app";
    expect(clerkAuthorizedParties()).toContain("https://bury-steps-abc123.vercel.app");
  });
});

describe("accountPortalHref", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("keeps a trusted return URL", () => {
    const returnTo = `${PRODUCTION_APP_URL}/w/abc123`;
    const href = accountPortalHref("sign-in", returnTo);
    expect(new URL(href).searchParams.get("redirect_url")).toBe(returnTo);
  });

  it("swaps an untrusted return URL for the dashboard instead of forwarding it", () => {
    const href = accountPortalHref("sign-in", "https://evil.example.com/steal-session");
    const redirect = new URL(href).searchParams.get("redirect_url");
    expect(redirect).not.toContain("evil.example.com");
    expect(redirect).toContain("/dashboard");
  });
});

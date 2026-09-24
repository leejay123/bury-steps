import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createRouteMatcher } from "@clerk/nextjs/server";

vi.mock("@/lib/urls", () => ({ clerkAuthorizedParties: () => [], shouldProxyClerkFrontendApi: () => false }));

import { PUBLIC_ROUTES } from "./proxy";

const isPublic = createRouteMatcher(PUBLIC_ROUTES);
const at = (path: string) => isPublic(new NextRequest(`https://example.test${path}`));

describe("public routes", () => {
  it("lets signed-out people use the links in email footers", () => {
    // Newsletter subscribers from the homepage footer have no account at all.
    expect(at("/email-preferences/newsletter/abc123token")).toBe(true);
    expect(at("/email-preferences/member-token-xyz")).toBe(true);
  });

  it("keeps the signed-in email preferences page behind sign-in", () => {
    expect(at("/email-preferences")).toBe(false);
  });

  it("keeps member pages behind sign-in", () => {
    // (/walks is matched by the share-link pattern "/w(.*)"; that page
    // checks sign-in itself with requireUser.)
    for (const path of ["/history", "/notices", "/progress", "/onboarding"]) {
      expect(at(path), path).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { isTrustedClerkActorUrl } from "./clerk-actor-url";

describe("isTrustedClerkActorUrl", () => {
  it("allows https Clerk account-portal hosts", () => {
    expect(isTrustedClerkActorUrl("https://accounts.clerk.com/v1/client/actor/abc")).toBe(true);
    expect(isTrustedClerkActorUrl("https://foo.clerk.accounts.dev/v1/tickets")).toBe(true);
  });

  it("rejects non-https, wrong hosts, and garbage", () => {
    expect(isTrustedClerkActorUrl("http://accounts.clerk.com/x")).toBe(false);
    expect(isTrustedClerkActorUrl("https://evil.example/actor")).toBe(false);
    expect(isTrustedClerkActorUrl("https://clerk.example/actor")).toBe(false);
    expect(isTrustedClerkActorUrl("not-a-url")).toBe(false);
  });
});

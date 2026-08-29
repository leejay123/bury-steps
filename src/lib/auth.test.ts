import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./db", () => ({ prisma: { user: { findUnique: vi.fn() } } }));
vi.mock("./local-user", () => ({ syncLocalUser: vi.fn() }));

import { isClerkMiddlewareMissingError } from "./auth";

describe("isClerkMiddlewareMissingError", () => {
  it("matches Clerk's missing-middleware error", () => {
    expect(
      isClerkMiddlewareMissingError(
        new Error(
          "Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware(). Please ensure the following:",
        ),
      ),
    ).toBe(true);
  });

  it("does not swallow unrelated failures", () => {
    expect(isClerkMiddlewareMissingError(new Error("database unavailable"))).toBe(false);
    expect(isClerkMiddlewareMissingError("clerkMiddleware")).toBe(false);
    expect(isClerkMiddlewareMissingError(null)).toBe(false);
  });
});

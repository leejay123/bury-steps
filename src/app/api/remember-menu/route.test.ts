import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getOptionalUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getOptionalUser: () => getOptionalUser() }));
vi.mock("@/lib/progress-settings", () => ({ getProgressEnabled: async () => true }));

import { GET } from "./route";
import { parseRememberedNav, safeNext } from "@/lib/remembered-nav";

/** What the header script does with a cookie: split the header, then decodeURIComponent the value. */
function cookieFromHeader(setCookies: string[], name: string) {
  const line = setCookies.find((c) => c.startsWith(`${name}=`));
  if (!line) return undefined;
  return decodeURIComponent(line.slice(name.length + 1).split(";")[0]);
}

function call(next: string) {
  return GET(new NextRequest(`https://example.test/api/remember-menu?next=${encodeURIComponent(next)}`));
}

describe("remember-menu", () => {
  beforeEach(() => getOptionalUser.mockReset());

  it("saves an owner's full menu and carries on to the page asked for", async () => {
    getOptionalUser.mockResolvedValue({ role: "ADMIN", isOwner: true, firstName: "Lee", email: "x@y.z" });
    const res = await call("/walks?tab=history");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.test/walks?tab=history");
    const set = res.headers.getSetCookie();
    const nav = JSON.parse(cookieFromHeader(set, "bs-nav")!);
    expect(nav.map((i: { label: string }) => i.label)).toEqual([
      "Home", "Walks", "Notices", "Progress", "History", "Members", "Messages", "Reports", "Settings", "Guide",
    ]);
    expect(nav[1].href).toBe("/admin/walks");
    expect(JSON.parse(cookieFromHeader(set, "bs-bar")!)).toHaveLength(4);
    expect(cookieFromHeader(set, "bs-av")).toBe("L");
    expect(cookieFromHeader(set, "bs-menu-filled")).toBe("1");
    expect(cookieFromHeader(set, "bs-search")).toBe("1");
    // The server reads it back the same way it reads browser-written ones.
    const raw = set.find((c) => c.startsWith("bs-nav="))!.slice(7).split(";")[0];
    expect(parseRememberedNav(raw)).toEqual(nav);
  });

  it("saves a member's menu", async () => {
    getOptionalUser.mockResolvedValue({ role: "MEMBER", isOwner: false, firstName: "Ann", email: "a@b.c" });
    const set = (await call("/")).headers.getSetCookie();
    const nav = JSON.parse(cookieFromHeader(set, "bs-nav")!);
    expect(nav.map((i: { label: string }) => i.label)).toEqual(["Home", "Walks", "Notices", "Progress", "History"]);
    // Search is for owners only.
    expect(cookieFromHeader(set, "bs-search")).toBeUndefined();
  });

  it("only marks the visit when nobody is signed in, so it never loops", async () => {
    getOptionalUser.mockResolvedValue(null);
    const set = (await call("/walks")).headers.getSetCookie();
    expect(cookieFromHeader(set, "bs-nav")).toBeUndefined();
    expect(cookieFromHeader(set, "bs-menu-filled")).toBe("1");
  });

  it("never sends people to another site", () => {
    expect(safeNext("//evil.example/x")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
    expect(safeNext("/notices/abc?x=1")).toBe("/notices/abc?x=1");
  });
});

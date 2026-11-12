import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasSessionCookie, onceSignedOut } from "./sign-out-load";

describe("hasSessionCookie", () => {
  it("finds Clerk's sign-in cookie, plain or with its suffix", () => {
    expect(hasSessionCookie("__session=abc.def.ghi")).toBe(true);
    expect(hasSessionCookie("bs-in=1; __session_Xy12Z=abc.def.ghi; theme=dark")).toBe(true);
    expect(hasSessionCookie("bs-in=1;__session=abc")).toBe(true);
  });

  it("is false once the cookie is gone or emptied", () => {
    expect(hasSessionCookie("")).toBe(false);
    expect(hasSessionCookie("bs-in=1; theme=dark")).toBe(false);
    expect(hasSessionCookie("__session=; bs-in=1")).toBe(false);
    expect(hasSessionCookie("__session_Xy12Z=")).toBe(false);
  });

  it("ignores Clerk's other cookies and look-alikes", () => {
    expect(hasSessionCookie("__client_uat=1731400000; __client_uat_Xy12Z=1731400000")).toBe(false);
    expect(hasSessionCookie("my__session=abc")).toBe(false);
    expect(hasSessionCookie("__sessions=abc")).toBe(false);
  });
});

describe("onceSignedOut", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits while the cookie is still there, then calls done exactly once", () => {
    let cookie = "__session=abc";
    const done = vi.fn();
    onceSignedOut({ cookie: () => cookie, done });
    vi.advanceTimersByTime(400);
    expect(done).not.toHaveBeenCalled();
    cookie = "bs-nav=1";
    vi.advanceTimersByTime(50);
    expect(done).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("gives up without calling done when the cookie never goes", () => {
    const done = vi.fn();
    const gaveUp = vi.fn();
    onceSignedOut({ cookie: () => "__session=abc", done, gaveUp, giveUpAfterMs: 1000 });
    vi.advanceTimersByTime(60000);
    expect(done).not.toHaveBeenCalled();
    expect(gaveUp).toHaveBeenCalledTimes(1);
  });

  it("can be stopped", () => {
    const done = vi.fn();
    const stop = onceSignedOut({ cookie: () => "", done });
    stop();
    vi.advanceTimersByTime(1000);
    expect(done).not.toHaveBeenCalled();
  });
});

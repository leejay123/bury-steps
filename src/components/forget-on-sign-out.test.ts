import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (state: { user: object | null | undefined }) => void;

const forgetSignedIn = vi.fn();
let listeners: Listener[] = [];
let clerkUser: object | null | undefined;

vi.mock("react", () => ({ useEffect: (run: () => void) => run() }));
vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    get user() {
      return clerkUser;
    },
    addListener: (listener: Listener) => {
      listeners.push(listener);
      return () => {};
    },
  }),
}));
vi.mock("@/components/shadcnio/sidebar-state", () => ({ forgetSignedIn: () => forgetSignedIn() }));

const replace = vi.fn();
const reload = vi.fn();
let cookie = "";

function emit(user: object | null | undefined) {
  for (const listener of listeners) listener({ user });
}

/** A fresh copy each time: the module remembers that a load is under way. */
async function mount(islands = 1) {
  vi.resetModules();
  const mod = await import("./forget-on-sign-out");
  for (let i = 0; i < islands; i++) mod.ForgetOnSignOut();
  return mod;
}

beforeEach(() => {
  vi.useFakeTimers();
  listeners = [];
  clerkUser = { id: "user_1" };
  cookie = "bs-in=1; __session=abc.def.ghi";
  forgetSignedIn.mockClear();
  replace.mockClear();
  reload.mockClear();
  vi.stubGlobal("document", {
    get cookie() {
      return cookie;
    },
  });
  vi.stubGlobal("window", { location: { replace, reload } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ForgetOnSignOut", () => {
  it("waits for the session to end, then loads the homepage afresh — once, with several islands", async () => {
    await mount(3);
    emit(undefined); // Sign out pressed: Clerk is still ending the session
    expect(forgetSignedIn).toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(replace).not.toHaveBeenCalled(); // not before the cookie has gone

    cookie = "theme=dark";
    vi.advanceTimersByTime(50);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/");

    emit(null); // Clerk's own "signed out", a moment later
    vi.advanceTimersByTime(1000);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it("goes where the invite page's sign-out leads", async () => {
    const mod = await mount();
    mod.signOutLandsOn("https://accounts.example.test/sign-in?redirect_url=x");
    emit(undefined);
    cookie = "";
    vi.advanceTimersByTime(50);
    expect(replace).toHaveBeenCalledWith("https://accounts.example.test/sign-in?redirect_url=x");
  });

  it("reloads the page it is on when signed out from another tab", async () => {
    await mount(2);
    cookie = ""; // the other tab already removed it
    emit(null);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("still loads afresh if the cookie could not be watched", async () => {
    await mount();
    cookie = "";
    emit(undefined);
    vi.advanceTimersByTime(1000);
    expect(replace).not.toHaveBeenCalled();
    emit(null);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does nothing for someone who was never signed in on this page", async () => {
    clerkUser = undefined;
    await mount();
    emit(null);
    vi.advanceTimersByTime(20000);
    expect(forgetSignedIn).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not leave when Clerk only paused and the member stays signed in", async () => {
    await mount();
    emit(undefined);
    vi.advanceTimersByTime(20000); // cookie never goes: gives up
    emit({ id: "user_1" });
    expect(replace).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});

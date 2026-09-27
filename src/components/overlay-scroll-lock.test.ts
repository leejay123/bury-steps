import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function fakeStyle() {
  const style: Record<string, string> & { removeProperty: (prop: string) => void } = {
    // A real CSSStyleDeclaration reads unset properties as "".
    overflow: "",
    overscrollBehavior: "",
    touchAction: "",
    position: "",
    top: "",
    removeProperty(prop: string) {
      delete style[prop];
    },
  } as never;
  return style;
}

describe("lockBackgroundScroll", () => {
  let html: { style: ReturnType<typeof fakeStyle> };
  let body: { style: ReturnType<typeof fakeStyle>; hasAttribute: () => boolean };

  beforeEach(() => {
    vi.resetModules();
    html = { style: fakeStyle() };
    body = { style: fakeStyle(), hasAttribute: () => false };
    vi.stubGlobal("document", {
      documentElement: html,
      body,
      activeElement: null,
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    vi.stubGlobal("window", {
      scrollX: 0,
      scrollY: 0,
      scrollTo: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    vi.stubGlobal(
      "MutationObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("Element", class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unlocks the page when overlapping overlays release out of order", async () => {
    const { lockBackgroundScroll } = await import("./overlay-scroll-lock");
    const releaseDrawer = lockBackgroundScroll();
    const releaseDialog = lockBackgroundScroll();
    expect(html.style.overflow).toBe("hidden");

    releaseDrawer();
    expect(html.style.overflow).toBe("hidden");

    releaseDialog();
    expect(html.style.overflow).toBe("");
    expect(body.style.overflow).toBe("");
  });

  it("ignores a second call to the same release", async () => {
    const { lockBackgroundScroll } = await import("./overlay-scroll-lock");
    const releaseA = lockBackgroundScroll();
    const releaseB = lockBackgroundScroll();
    releaseA();
    releaseA();
    expect(html.style.overflow).toBe("hidden");
    releaseB();
    expect(html.style.overflow).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { bottomBarShift } from "./bottom-bar-shift";

describe("bottomBarShift", () => {
  it("leaves the bar alone when it is already on the bottom", () => {
    expect(bottomBarShift({ anchor: 667, visibleHeight: 667, scale: 1 })).toBe(0);
  });

  it("moves the bar down by the gap the keyboard left behind", () => {
    // Fixed layer stuck at the keyboard's top edge, screen back to full height.
    expect(bottomBarShift({ anchor: 443, visibleHeight: 667, scale: 1 })).toBe(224);
  });

  it("ignores sub-pixel differences", () => {
    expect(bottomBarShift({ anchor: 666.4, visibleHeight: 667, scale: 1 })).toBe(0);
  });

  it("never moves the bar up", () => {
    // Keyboard open: the visible area is shorter than the page.
    expect(bottomBarShift({ anchor: 667, visibleHeight: 400, scale: 1 })).toBe(0);
  });

  it("stays put while pinch-zoomed", () => {
    expect(bottomBarShift({ anchor: 443, visibleHeight: 667, scale: 2 })).toBe(0);
  });
});

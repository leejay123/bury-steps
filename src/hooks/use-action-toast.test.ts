import { describe, expect, it, vi } from "vitest";
import { preventDismissWhilePending } from "./prevent-dismiss";

describe("preventDismissWhilePending", () => {
  it("ignores a close while the save is in flight", () => {
    const setOpen = vi.fn();
    preventDismissWhilePending(true, setOpen)(false);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("allows a close once the save has finished", () => {
    const setOpen = vi.fn();
    preventDismissWhilePending(false, setOpen)(false);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("still allows opening while a previous save is pending", () => {
    const setOpen = vi.fn();
    preventDismissWhilePending(true, setOpen)(true);
    expect(setOpen).toHaveBeenCalledWith(true);
  });
});

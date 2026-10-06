import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { guardArgs, guardForm } from "./safe-action";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({ id: "user-1" })),
  requireAdmin: vi.fn(async () => ({ id: "admin-1", role: "ADMIN" })),
}));

describe("guardForm", () => {
  it("does not run the save when the form doesn't match", async () => {
    const execute = vi.fn(async () => ({ ok: true as const }));
    const save = guardForm(
      "public",
      z.object({ title: z.string().min(1, "Add a title.") }),
      (formData) => ({ title: String(formData.get("title") ?? "") }),
      execute,
    );
    const formData = new FormData();
    const result = await save(null, formData);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Add a title.");
    expect(execute).not.toHaveBeenCalled();
  });

  it("runs the save once the form matches", async () => {
    const execute = vi.fn(async () => ({ ok: true as const, message: "Saved." }));
    const save = guardForm(
      "public",
      z.object({ title: z.string().min(1) }),
      (formData) => ({ title: String(formData.get("title") ?? "") }),
      execute,
    );
    const formData = new FormData();
    formData.set("title", "Burrs");
    const result = await save(null, formData);
    expect(result).toEqual({ ok: true, message: "Saved." });
    expect(execute).toHaveBeenCalledOnce();
  });
});

describe("guardArgs", () => {
  it("rejects an empty id before the save runs", async () => {
    const execute = vi.fn(async () => ({ ok: true as const }));
    const save = guardArgs("public", z.object({ id: z.string().min(1, "No walk selected.") }), execute);
    const result = await save({ id: "" });
    expect(result.ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });
});

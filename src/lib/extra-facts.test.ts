import { describe, expect, it } from "vitest";
import { MAX_EXTRA_FACTS, parseExtraFacts } from "./extra-facts";

describe("parseExtraFacts", () => {
  it("keeps facts with both a name and a value, trimmed", () => {
    expect(
      parseExtraFacts(
        JSON.stringify([
          { name: " Parking ", value: " Bank Lane car park " },
          { name: "Terrain", value: "" },
          { name: "", value: "Rocky" },
        ]),
      ),
    ).toEqual([{ name: "Parking", value: "Bank Lane car park", icon: "info" }]);
  });

  it("reads saved arrays and ignores anything else", () => {
    expect(parseExtraFacts([{ name: "A", value: "B", icon: "parking" }])).toEqual([
      { name: "A", value: "B", icon: "parking" },
    ]);
    expect(parseExtraFacts([{ name: "A", value: "B", icon: "nope" }])[0].icon).toBe("info");
    expect(parseExtraFacts(null)).toEqual([]);
    expect(parseExtraFacts("not json")).toEqual([]);
    expect(parseExtraFacts({ name: "A" })).toEqual([]);
  });

  it("caps how many are kept", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `N${i}`, value: "v" }));
    expect(parseExtraFacts(many)).toHaveLength(MAX_EXTRA_FACTS);
  });
});

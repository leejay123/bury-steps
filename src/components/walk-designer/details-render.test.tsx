import { describe, expect, it } from "vitest";
import { DetailsBlock } from "./blocks";
import { walkDesignConfig } from "./config";

type El = { type: unknown; props: Record<string, unknown> & { children?: El } };

/** Steps through the designer's wrappers to the Details card itself. */
function detailsCard(props: Record<string, unknown>): El {
  const render = walkDesignConfig.components.Details.render as unknown as (p: Record<string, unknown>) => El;
  let el = render({ ...props, puck: {} });
  for (let i = 0; i < 10 && el.type !== DetailsBlock; i++) {
    if (el.props.children) el = el.props.children;
    else if (typeof el.type === "function") el = (el.type as (p: unknown) => El)(el.props);
  }
  return el;
}

describe("Details card settings", () => {
  // Both were saved but dropped on the way to the card (Nov 2026).
  it("reach the card: Clocked in / attended look and countdown style", () => {
    const card = detailsCard({ peopleLook: "pill", countdownStyle: "digital" });
    expect(card.type).toBe(DetailsBlock);
    expect(card.props.peopleLook).toBe("pill");
    expect(card.props.countdownStyle).toBe("digital");
  });
});

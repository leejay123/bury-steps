import { describe, expect, it } from "vitest";
import { WALK_WORDING_DEFAULTS } from "@/lib/walk-wording";
import {
  extractWalkDesignCopy,
  joinStatusLine,
  splitStatusLine,
  statusPropsFromWording,
  withSiteCopy,
  wordingFromStatusProps,
} from "./walk-design-copy";

const copy = {
  tips: ["Bring water.", "Wear shoes."],
  steps: [{ title: "Join", body: "Make an account." }],
  wording: { ...WALK_WORDING_DEFAULTS, upcomingLabel: "Coming up" },
};

describe("status line split", () => {
  it("keeps the name and the rest around the first ·", () => {
    expect(splitStatusLine("Upcoming · Clock-in from {opens}")).toEqual({
      name: "Upcoming",
      rest: "Clock-in from {opens}",
    });
    expect(joinStatusLine("Upcoming", "Clock-in from {opens}")).toBe(
      "Upcoming · Clock-in from {opens}",
    );
  });
});

describe("extractWalkDesignCopy", () => {
  it("reads Before tips and How this group works steps from nested tabs", () => {
    const extracted = extractWalkDesignCopy({
      content: [
        {
          type: "Tabs",
          props: {
            tabs: [
              {
                label: "Before you set off",
                content: [{ type: "Before", props: { tips: [{ text: "Bring water." }, { text: "" }] } }],
              },
              {
                label: "How",
                content: [
                  {
                    type: "HowItWorks",
                    props: { steps: [{ title: "Join", body: "Make an account." }] },
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    expect(extracted.tips).toEqual(["Bring water."]);
    expect(extracted.steps).toEqual([{ title: "Join", body: "Make an account." }]);
  });

  it("reads Status wording and ignores empty blocks", () => {
    const extracted = extractWalkDesignCopy({
      content: [
        { type: "Before", props: { tips: [] } },
        { type: "Status", props: { upcoming: "Soon · Opens at {opens}", memberBefore: "Wait until {opens}." } },
      ],
    });
    expect(extracted.tips).toBeNull();
    expect(extracted.wording?.upcomingLabel).toBe("Soon");
    expect(extracted.wording?.upcomingLine).toBe("Opens at {opens}");
    expect(extracted.wording?.memberBefore).toBe("Wait until {opens}.");
  });

  it("reads message wording from the Messages block, over Status", () => {
    const extracted = extractWalkDesignCopy({
      content: [
        { type: "Status", props: { upcoming: "Soon · Opens at {opens}", memberBefore: "Old." } },
        { type: "Messages", props: { look: "as-is", memberBefore: "Wait until {opens}." } },
      ],
    });
    expect(extracted.wording?.upcomingLabel).toBe("Soon");
    expect(extracted.wording?.memberBefore).toBe("Wait until {opens}.");
  });
});

describe("withSiteCopy", () => {
  it("fills empty Before, How this group works, Status and Messages from the live copy", () => {
    const filled = withSiteCopy(
      {
        content: [
          { type: "Before", props: { look: "card" } },
          { type: "HowItWorks", props: { look: "card" } },
          { type: "Status", props: { variant: "box" } },
          { type: "Messages", props: { look: "as-is" } },
        ],
      },
      copy,
    );
    expect(extractWalkDesignCopy(filled)).toEqual({
      tips: ["Bring water.", "Wear shoes."],
      steps: [{ title: "Join", body: "Make an account." }],
      wording: expect.objectContaining({
        upcomingLabel: "Coming up",
        memberBefore: copy.wording.memberBefore,
      }),
    });
  });

  it("leaves copy that is already on the block", () => {
    const filled = withSiteCopy(
      {
        content: [{ type: "Before", props: { tips: [{ text: "Already here." }] } }],
      },
      copy,
    );
    expect(extractWalkDesignCopy(filled).tips).toEqual(["Already here."]);
  });
});

describe("wordingFromStatusProps", () => {
  it("keeps defaults for blank fields", () => {
    const wording = wordingFromStatusProps(
      { upcoming: "Soon · from {opens}" },
      WALK_WORDING_DEFAULTS,
    );
    expect(wording.upcomingLabel).toBe("Soon");
    expect(wording.openLabel).toBe(WALK_WORDING_DEFAULTS.openLabel);
    expect(statusPropsFromWording(wording).upcoming).toBe("Soon · from {opens}");
  });
});

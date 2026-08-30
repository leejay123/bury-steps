import { describe, expect, it } from "vitest";
import {
  MAX_NOTICE_BELL_BODY,
  noticeBodyForBellDrawer,
  noticeUnreadBadgeLabel,
  type NoticeView,
} from "./notices";

function notice(partial: Partial<NoticeView> & Pick<NoticeView, "body" | "kind">): NoticeView {
  return {
    id: "1",
    title: "Title",
    audience: "MEMBERS",
    slug: partial.kind === "PAGE" ? "slug" : null,
    pageBody: partial.kind === "PAGE" ? "Long page" : null,
    categoryId: null,
    categoryLabel: null,
    systemKey: null,
    enabled: true,
    createdAt: new Date("2026-08-30T12:00:00.000Z"),
    updatedAt: new Date("2026-08-30T12:00:00.000Z"),
    ...partial,
  };
}

describe("noticeBodyForBellDrawer", () => {
  it("leaves the welcome notice untruncated", () => {
    const body = "a".repeat(MAX_NOTICE_BELL_BODY + 40);
    expect(
      noticeBodyForBellDrawer(
        notice({ body, kind: "BELL", systemKey: "welcome" }),
      ),
    ).toBe(body);
  });

  it("shows a short bell-only message in full", () => {
    expect(noticeBodyForBellDrawer(notice({ body: "Meet at 2pm.", kind: "BELL" }))).toBe(
      "Meet at 2pm.",
    );
  });

  it("truncates a long bell-only message with an ellipsis", () => {
    const body = "a".repeat(MAX_NOTICE_BELL_BODY + 20);
    const shown = noticeBodyForBellDrawer(notice({ body, kind: "BELL" }));
    expect(shown.endsWith("…")).toBe(true);
    expect(shown.length).toBe(MAX_NOTICE_BELL_BODY + 1);
  });

  it("always ends a full-page teaser with an ellipsis in the drawer", () => {
    expect(noticeBodyForBellDrawer(notice({ body: "Short teaser", kind: "PAGE" }))).toBe(
      "Short teaser…",
    );
  });
});

describe("noticeUnreadBadgeLabel", () => {
  it("labels a fresh notice as New", () => {
    expect(noticeUnreadBadgeLabel(notice({ body: "Hi", kind: "BELL" }))).toBe("New");
  });

  it("labels an edited notice as Updated", () => {
    expect(
      noticeUnreadBadgeLabel(
        notice({
          body: "Hi",
          kind: "BELL",
          createdAt: new Date("2026-08-30T12:00:00.000Z"),
          updatedAt: new Date("2026-08-31T09:00:00.000Z"),
        }),
      ),
    ).toBe("Updated");
  });
});

-- Extra notice categories and demo full-page notices (public + members-only),
-- plus keep the older bell-only seeds readable after the page/audience columns landed.

INSERT INTO "SiteNoticeCategory" ("id", "slug", "label", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('noticecat_walks', 'walks', 'Walks', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('noticecat_group', 'group-news', 'Group news', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Older bell-only demo rows: leave as BELL / MEMBERS (defaults). Refresh copy if present.
UPDATE "SiteNotice"
SET
  "title" = 'Welcome to the group',
  "body" = 'Thanks for joining Bury Steps. Open Walks for the next Sunday, and use the share link on the day to clock in. Questions are welcome in the Facebook group too.',
  "kind" = 'BELL',
  "audience" = 'MEMBERS',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'notice_seed_welcome';

UPDATE "SiteNotice"
SET
  "title" = 'Sunday weather check',
  "body" = 'The forecast looks changeable this weekend. Bring a waterproof and sturdy shoes. If we have to cancel, we will update this notice and the walk page.',
  "kind" = 'BELL',
  "audience" = 'MEMBERS',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'notice_seed_weather';

UPDATE "SiteNotice"
SET
  "title" = 'Sign-in on the day',
  "body" = 'Please clock in when you arrive so we know who is on the walk. It only takes a moment and helps keep everyone safe.',
  "kind" = 'BELL',
  "audience" = 'MEMBERS',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'notice_seed_meetup';

-- Public full-page announcements (visible to guests on /notices)
INSERT INTO "SiteNotice" (
  "id",
  "title",
  "body",
  "kind",
  "audience",
  "slug",
  "pageBody",
  "categoryId",
  "createdAt",
  "updatedAt"
)
SELECT v.id, v.title, v.body, v.kind::"SiteNoticeKind", v.audience::"SiteNoticeAudience", v.slug, v."pageBody", v."categoryId", NOW() - v.age, NOW() - v.age
FROM (
  VALUES
    (
      'notice_seed_public_join',
      'New to Bury Steps?',
      'Anyone is welcome on our Sunday walks. Here is how a typical morning works, from meeting point to clock-in.',
      'PAGE',
      'PUBLIC',
      'new-to-bury-steps',
      E'Bury Steps is a friendly walking group based around Bury.\n\nYou do not need to be fit or fast. Walks are self-paced, and there are no winners or losers. Beginners and people returning after a break are welcome.\n\nWhat to expect\n• We usually meet on a Sunday morning at a published meeting point.\n• Check the walk page for the time, place, and length.\n• Wear comfortable shoes and bring weather-appropriate clothes and water.\n• When you arrive, signed-in members clock in on the walk page so organisers know who is on the walk.\n\nIf you do not have an account yet, create one from the site, then open the walk share link again. You can also ask questions in the Facebook group.\n\nWe look forward to walking with you.',
      'noticecat_group',
      INTERVAL '5 days'
    ),
    (
      'notice_seed_public_open',
      'Open invitation this month',
      'Bring a friend along to any Sunday walk this month. No booking fee — just turn up ready to walk.',
      'PAGE',
      'PUBLIC',
      'open-invitation-this-month',
      E'This month we are especially glad to welcome new faces.\n\nIf you already walk with us, feel free to invite a friend or family member. If you are visiting for the first time, come along to the next published walk — details are on the Walks page once you have an account, or ask in the Facebook group for the latest share link.\n\nPractical notes\n• Meet at the published meeting point a few minutes early.\n• Wear shoes that cope with paths and pavements.\n• Bring water, and a waterproof if the forecast looks mixed.\n• Children are welcome when accompanied by a responsible adult.\n\nSee you on the path.',
      'noticecat_walks',
      INTERVAL '1 day'
    ),
    (
      'notice_seed_members_kit',
      'Member reminder: what to bring',
      'A short checklist for regulars — especially useful if the weather turns mid-walk.',
      'PAGE',
      'MEMBERS',
      'member-what-to-bring',
      E'This note is for signed-in members.\n\nBefore you leave home\n• Check the walk page for the meeting point and any last-minute change.\n• Pack water, and a light snack if the walk is longer than usual.\n• Bring a waterproof layer even if the morning looks fine — Greater Manchester weather changes quickly.\n• If you need to leave early, use Clock out on the walk page and give a short reason so organisers know you are safe.\n\nHealth notes you share at clock-in are only visible to organisers and are cleared after the retention period.\n\nThanks for looking out for each other.',
      'noticecat_walks',
      INTERVAL '8 hours'
    )
) AS v(id, title, body, kind, audience, slug, "pageBody", "categoryId", age)
WHERE NOT EXISTS (
  SELECT 1 FROM "SiteNotice" n WHERE n.id = v.id
);

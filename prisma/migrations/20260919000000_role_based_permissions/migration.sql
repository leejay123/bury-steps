-- Replace per-organiser permission columns on "User" with a single shared
-- "RolePermissions" row that applies to every organiser at once (see
-- schema.prisma's RolePermissions doc comment).
--
-- The new row is seeded from whatever the site's most-recently-created
-- organiser currently has, falling back to full access if there are no
-- organisers yet — this keeps the transition a no-op for a live site
-- rather than resetting everyone's access to some fixed default.

CREATE TABLE "RolePermissions" (
    "id" TEXT NOT NULL,
    "permWalksView" BOOLEAN NOT NULL DEFAULT true,
    "permWalksCreate" BOOLEAN NOT NULL DEFAULT true,
    "permWalksEdit" BOOLEAN NOT NULL DEFAULT true,
    "permWalksCancel" BOOLEAN NOT NULL DEFAULT true,
    "permWalksAttendance" BOOLEAN NOT NULL DEFAULT true,
    "permWalksHealth" BOOLEAN NOT NULL DEFAULT true,
    "permWalksJourney" BOOLEAN NOT NULL DEFAULT true,
    "permWalksExport" BOOLEAN NOT NULL DEFAULT true,
    "permMembersView" BOOLEAN NOT NULL DEFAULT true,
    "permMessages" BOOLEAN NOT NULL DEFAULT true,
    "permReportsView" BOOLEAN NOT NULL DEFAULT true,
    "permReportsEdit" BOOLEAN NOT NULL DEFAULT true,
    "permReportsCreate" BOOLEAN NOT NULL DEFAULT true,
    "permHomepage" BOOLEAN NOT NULL DEFAULT true,
    "permNotices" BOOLEAN NOT NULL DEFAULT true,
    "permProgress" BOOLEAN NOT NULL DEFAULT true,
    "permEmails" BOOLEAN NOT NULL DEFAULT true,
    "permSubscribers" BOOLEAN NOT NULL DEFAULT true,
    "permDisplay" BOOLEAN NOT NULL DEFAULT true,
    "permCacheReset" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RolePermissions" (
    "id", "permWalksView", "permWalksCreate", "permWalksEdit", "permWalksCancel",
    "permWalksAttendance", "permWalksHealth", "permWalksJourney", "permWalksExport",
    "permMembersView", "permMessages",
    "permReportsView", "permReportsEdit", "permReportsCreate",
    "permHomepage", "permNotices", "permProgress", "permEmails", "permSubscribers",
    "permDisplay", "permCacheReset", "updatedAt"
)
SELECT
    'organiser',
    COALESCE(u."permWalksView", true),
    COALESCE(u."permWalksCreate", true),
    COALESCE(u."permWalksEdit", true),
    COALESCE(u."permWalksCancel", true),
    COALESCE(u."permWalksAttendance", true),
    COALESCE(u."permWalksHealth", true),
    COALESCE(u."permWalksJourney", true),
    COALESCE(u."permWalksExport", true),
    COALESCE(u."permMembersView", true),
    COALESCE(u."permMessages", true),
    COALESCE(u."permReports", true),
    COALESCE(u."permReports", true),
    COALESCE(u."permReports", true),
    COALESCE(u."permHomepage", true),
    COALESCE(u."permNotices", true),
    COALESCE(u."permProgress", true),
    COALESCE(u."permEmails", true),
    COALESCE(u."permSubscribers", true),
    COALESCE(u."permDisplay", true),
    COALESCE(u."permCacheReset", true),
    now()
FROM (SELECT 1) AS one
LEFT JOIN LATERAL (
    SELECT * FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" DESC LIMIT 1
) AS u ON true;

ALTER TABLE "User"
    DROP COLUMN "permWalksView",
    DROP COLUMN "permWalksCreate",
    DROP COLUMN "permWalksEdit",
    DROP COLUMN "permWalksCancel",
    DROP COLUMN "permWalksDelete",
    DROP COLUMN "permWalksAttendance",
    DROP COLUMN "permWalksHealth",
    DROP COLUMN "permWalksJourney",
    DROP COLUMN "permWalksExport",
    DROP COLUMN "permMembersView",
    DROP COLUMN "permMembersRemove",
    DROP COLUMN "permMessages",
    DROP COLUMN "permReports",
    DROP COLUMN "permHomepage",
    DROP COLUMN "permNotices",
    DROP COLUMN "permProgress",
    DROP COLUMN "permEmails",
    DROP COLUMN "permSubscribers",
    DROP COLUMN "permDisplay",
    DROP COLUMN "permCacheReset";

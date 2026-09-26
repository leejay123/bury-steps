-- Structured walk facts (distance, grade, walk leader, back marker) that
-- used to be typed as free-text lines inside the description. All optional
-- and nullable so existing walks are unaffected.
ALTER TABLE "Walk" ADD COLUMN "distance" TEXT;
ALTER TABLE "Walk" ADD COLUMN "grade" TEXT;
ALTER TABLE "Walk" ADD COLUMN "walkLeader" TEXT;
ALTER TABLE "Walk" ADD COLUMN "backMarker" TEXT;

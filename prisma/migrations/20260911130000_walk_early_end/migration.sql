-- Lets an organiser end a walk before its scheduled length is up, or
-- record that it actually finished a bit earlier than "now" (see
-- endWalkEarly). Null means the scheduled length alone decides when the
-- walk is done, same as before this column existed.
ALTER TABLE "Walk" ADD COLUMN "endedAt" TIMESTAMP(3);

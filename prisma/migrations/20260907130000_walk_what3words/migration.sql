-- Optional what3words address, stored as plain text. Purely additive: no
-- existing column changes, every existing walk gets NULL and carries on
-- exactly as before.

ALTER TABLE "Walk" ADD COLUMN "what3words" TEXT;

-- Drawn walking routes, reusable across walks.
--
-- Purely additive: no existing column changes and no data is rewritten.
-- Every walk that already exists gets routeId NULL and carries on exactly
-- as before.

CREATE TABLE "WalkRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "points" JSONB NOT NULL,
    "distanceMetres" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WalkRoute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WalkRoute_createdById_idx" ON "WalkRoute"("createdById");

CREATE INDEX "WalkRoute_name_idx" ON "WalkRoute"("name");

ALTER TABLE "WalkRoute" ADD CONSTRAINT "WalkRoute_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Walk" ADD COLUMN "routeId" TEXT;

CREATE INDEX "Walk_routeId_idx" ON "Walk"("routeId");

-- SET NULL, not CASCADE: deleting a route must never delete a walk or any
-- of its clock-in history. The walk simply stops showing a map.
ALTER TABLE "Walk" ADD CONSTRAINT "Walk_routeId_fkey"
    FOREIGN KEY ("routeId") REFERENCES "WalkRoute"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

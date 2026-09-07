-- Removes the drawn/GPX-imported walking routes feature entirely: the
-- WalkRoute table, its link from Walk, and the difficulty enum. This is
-- destructive — every route in WalkRoute (and its GPX-derived distance,
-- elevation, and points data) is permanently deleted. Walk history,
-- attendance, and everything else on Walk is untouched: routeId is simply
-- dropped, exactly like every walk created before routes existed.

-- DropForeignKey
ALTER TABLE "Walk" DROP CONSTRAINT "Walk_routeId_fkey";

-- DropForeignKey
ALTER TABLE "WalkRoute" DROP CONSTRAINT "WalkRoute_createdById_fkey";

-- DropIndex
DROP INDEX "Walk_routeId_idx";

-- AlterTable
ALTER TABLE "Walk" DROP COLUMN "routeId";

-- DropTable
DROP TABLE "WalkRoute";

-- DropEnum
DROP TYPE "RouteDifficulty";

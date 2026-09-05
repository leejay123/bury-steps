-- CreateEnum
CREATE TYPE "RouteDifficulty" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- AlterTable
ALTER TABLE "WalkRoute" ADD COLUMN "elevationGainMetres" DOUBLE PRECISION;
ALTER TABLE "WalkRoute" ADD COLUMN "elevationLossMetres" DOUBLE PRECISION;
ALTER TABLE "WalkRoute" ADD COLUMN "maxElevationMetres" DOUBLE PRECISION;
ALTER TABLE "WalkRoute" ADD COLUMN "minElevationMetres" DOUBLE PRECISION;
ALTER TABLE "WalkRoute" ADD COLUMN "difficulty" "RouteDifficulty";

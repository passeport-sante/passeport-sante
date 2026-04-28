-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'PHRASE_A_TROU';
ALTER TYPE "GameType" ADD VALUE 'SCENARIO';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "colorCard" TEXT,
ADD COLUMN     "colorCardSecondary" TEXT;

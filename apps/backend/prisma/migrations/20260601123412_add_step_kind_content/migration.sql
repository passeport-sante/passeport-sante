-- CreateEnum
CREATE TYPE "StepKind" AS ENUM ('GAME', 'CONTENT');

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "kind" "StepKind" NOT NULL DEFAULT 'GAME',
ALTER COLUMN "gameType" DROP NOT NULL;

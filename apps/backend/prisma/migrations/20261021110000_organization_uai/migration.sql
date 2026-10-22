-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "uai" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_uai_key" ON "Organization"("uai");

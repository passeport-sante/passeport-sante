-- DropForeignKey
ALTER TABLE "DiagnosticSession" DROP CONSTRAINT "DiagnosticSession_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleSession" DROP CONSTRAINT "ModuleSession_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "DiagnosticSession" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ModuleSession" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ModuleSession" ADD CONSTRAINT "ModuleSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

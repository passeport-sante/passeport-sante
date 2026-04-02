-- DropForeignKey
ALTER TABLE "GuestStudent" DROP CONSTRAINT "GuestStudent_sessionId_fkey";

-- AlterTable
ALTER TABLE "GuestStudent" ADD COLUMN     "diagnosticSessionId" TEXT,
ALTER COLUMN "sessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GuestStudent" ADD CONSTRAINT "GuestStudent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ModuleSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestStudent" ADD CONSTRAINT "GuestStudent_diagnosticSessionId_fkey" FOREIGN KEY ("diagnosticSessionId") REFERENCES "DiagnosticSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

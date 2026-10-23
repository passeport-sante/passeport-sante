-- DropForeignKey
ALTER TABLE "ModuleSession" DROP CONSTRAINT "ModuleSession_moduleId_fkey";

-- AlterTable
ALTER TABLE "ModuleSession" ALTER COLUMN "moduleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ModuleSession" ADD CONSTRAINT "ModuleSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

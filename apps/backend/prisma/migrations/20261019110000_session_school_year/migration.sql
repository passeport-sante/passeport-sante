-- Année scolaire des sessions, au format "2026-2027", bascule au 1er août
-- (même règle que src/common/school-year.ts). Les sessions existantes la
-- reçoivent d'après leur date de création.

-- AlterTable
ALTER TABLE "DiagnosticSession" ADD COLUMN "schoolYear" TEXT;
ALTER TABLE "ModuleSession" ADD COLUMN "schoolYear" TEXT;

UPDATE "DiagnosticSession"
SET "schoolYear" = CASE
  WHEN EXTRACT(MONTH FROM "createdAt") >= 8
    THEN EXTRACT(YEAR FROM "createdAt")::int || '-' || (EXTRACT(YEAR FROM "createdAt")::int + 1)
  ELSE (EXTRACT(YEAR FROM "createdAt")::int - 1) || '-' || EXTRACT(YEAR FROM "createdAt")::int
END;

UPDATE "ModuleSession"
SET "schoolYear" = CASE
  WHEN EXTRACT(MONTH FROM "createdAt") >= 8
    THEN EXTRACT(YEAR FROM "createdAt")::int || '-' || (EXTRACT(YEAR FROM "createdAt")::int + 1)
  ELSE (EXTRACT(YEAR FROM "createdAt")::int - 1) || '-' || EXTRACT(YEAR FROM "createdAt")::int
END;

ALTER TABLE "DiagnosticSession" ALTER COLUMN "schoolYear" SET NOT NULL;
ALTER TABLE "ModuleSession" ALTER COLUMN "schoolYear" SET NOT NULL;

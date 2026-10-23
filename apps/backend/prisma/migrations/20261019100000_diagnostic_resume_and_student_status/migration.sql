-- AlterTable
ALTER TABLE "GuestStudent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "excludedAt" TIMESTAMP(3);

-- Doublons existants : on garde la réponse la plus récente de chaque élève à
-- chaque question, sans quoi l'index unique ci-dessous ne peut pas être créé.
DELETE FROM "DiagnosticResponse" a
USING "DiagnosticResponse" b
WHERE a."guestStudentId" = b."guestStudentId"
  AND a."questionId" = b."questionId"
  AND (a."createdAt" < b."createdAt" OR (a."createdAt" = b."createdAt" AND a."id" < b."id"));

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticResponse_guestStudentId_questionId_key" ON "DiagnosticResponse"("guestStudentId", "questionId");

-- Élèves existants : date d'arrivée = première réponse (à défaut, la date de
-- la migration), et terminé si toutes les questions ont une réponse.
UPDATE "GuestStudent" g
SET "createdAt" = r."firstAt"
FROM (
  SELECT "guestStudentId", MIN("createdAt") AS "firstAt"
  FROM "DiagnosticResponse"
  GROUP BY "guestStudentId"
) r
WHERE r."guestStudentId" = g."id";

UPDATE "GuestStudent" g
SET "completedAt" = r."lastAt"
FROM (
  SELECT "guestStudentId", MAX("createdAt") AS "lastAt", COUNT(*) AS "answered"
  FROM "DiagnosticResponse"
  GROUP BY "guestStudentId"
) r
WHERE r."guestStudentId" = g."id"
  AND g."diagnosticSessionId" IS NOT NULL
  AND r."answered" >= (SELECT COUNT(*) FROM "DiagnosticQuestion");

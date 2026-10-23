-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME');

-- AlterTable
ALTER TABLE "DiagnosticSession" ADD COLUMN "level" "ClassLevel";
ALTER TABLE "ModuleSession" ADD COLUMN "level" "ClassLevel";

-- Sessions existantes : niveau déduit du nom de classe quand il est clair
-- ("6e B", "6ème A", "6B", "Sixième"…). Sinon il reste vide et la session
-- apparaît en « Non renseigné » dans les statistiques.
-- Même règle pour les deux tables.
UPDATE "DiagnosticSession" SET "level" = CASE
  WHEN "className" ~* '^\s*6(\s|e|è|$|[a-z])' OR "className" ~* '^\s*sixi'   THEN 'SIXIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*5(\s|e|è|$|[a-z])' OR "className" ~* '^\s*cinqui' THEN 'CINQUIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*4(\s|e|è|$|[a-z])' OR "className" ~* '^\s*quatri' THEN 'QUATRIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*3(\s|e|è|$|[a-z])' OR "className" ~* '^\s*troisi' THEN 'TROISIEME'::"ClassLevel"
  ELSE NULL
END;

UPDATE "ModuleSession" SET "level" = CASE
  WHEN "className" ~* '^\s*6(\s|e|è|$|[a-z])' OR "className" ~* '^\s*sixi'   THEN 'SIXIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*5(\s|e|è|$|[a-z])' OR "className" ~* '^\s*cinqui' THEN 'CINQUIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*4(\s|e|è|$|[a-z])' OR "className" ~* '^\s*quatri' THEN 'QUATRIEME'::"ClassLevel"
  WHEN "className" ~* '^\s*3(\s|e|è|$|[a-z])' OR "className" ~* '^\s*troisi' THEN 'TROISIEME'::"ClassLevel"
  ELSE NULL
END;

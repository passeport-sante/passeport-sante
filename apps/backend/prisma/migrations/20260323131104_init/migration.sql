-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TRAINER');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('KANBAN', 'QUIZ', 'PUZZLE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'OPEN');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleSession" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "accessUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ModuleSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "mascotteImage" TEXT,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "accessUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DiagnosticSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "options" JSONB,
    "correctAnswer" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiagnosticQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticResponse" (
    "id" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "timing" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestStudentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "DiagnosticResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestStudent" (
    "id" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "GuestStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanbanResponse" (
    "id" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "timing" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestStudentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "KanbanResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "timing" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestStudentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleResponse" (
    "id" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "timing" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestStudentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "PuzzleResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameData" (
    "id" TEXT NOT NULL,
    "questionData" JSONB NOT NULL,
    "correctAnswer" JSONB,
    "hints" JSONB,
    "stepId" TEXT NOT NULL,

    CONSTRAINT "GameData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleProgress" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "completion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "guestStudentId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "ModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticsData" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "gender" TEXT,
    "ageRange" TEXT,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "StatisticsData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSession_accessCode_key" ON "ModuleSession"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSession_accessUrl_key" ON "ModuleSession"("accessUrl");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticSession_accessCode_key" ON "DiagnosticSession"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticSession_accessUrl_key" ON "DiagnosticSession"("accessUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleProgress_guestStudentId_moduleId_key" ON "ModuleProgress"("guestStudentId", "moduleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSession" ADD CONSTRAINT "ModuleSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSession" ADD CONSTRAINT "ModuleSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSession" ADD CONSTRAINT "ModuleSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_guestStudentId_fkey" FOREIGN KEY ("guestStudentId") REFERENCES "GuestStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DiagnosticQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestStudent" ADD CONSTRAINT "GuestStudent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ModuleSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanResponse" ADD CONSTRAINT "KanbanResponse_guestStudentId_fkey" FOREIGN KEY ("guestStudentId") REFERENCES "GuestStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanResponse" ADD CONSTRAINT "KanbanResponse_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanResponse" ADD CONSTRAINT "KanbanResponse_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_guestStudentId_fkey" FOREIGN KEY ("guestStudentId") REFERENCES "GuestStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleResponse" ADD CONSTRAINT "PuzzleResponse_guestStudentId_fkey" FOREIGN KEY ("guestStudentId") REFERENCES "GuestStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleResponse" ADD CONSTRAINT "PuzzleResponse_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleResponse" ADD CONSTRAINT "PuzzleResponse_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameData" ADD CONSTRAINT "GameData_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_guestStudentId_fkey" FOREIGN KEY ("guestStudentId") REFERENCES "GuestStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatisticsData" ADD CONSTRAINT "StatisticsData_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

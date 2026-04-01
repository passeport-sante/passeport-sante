/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Module` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "colorPrimary" TEXT,
ADD COLUMN     "colorSecondary" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "mascotte" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

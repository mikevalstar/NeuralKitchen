/*
  Warnings:

  - You are about to alter the column `description` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - A unique constraint covering the columns `[shortId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[recipeId,versionNumber]` on the table `RecipeVersion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionNumber` to the `RecipeVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "shortId" TEXT NOT NULL,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "public"."RecipeVersion" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_shortId_key" ON "public"."Project"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeVersion_recipeId_versionNumber_key" ON "public"."RecipeVersion"("recipeId", "versionNumber");

/*
  Warnings:

  - Added the required column `updatedAt` to the `RecipeQueue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add columns with default values for existing rows
ALTER TABLE "public"."RecipeQueue" ADD COLUMN     "error" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Update existing rows to use createdAt as updatedAt value
UPDATE "public"."RecipeQueue" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

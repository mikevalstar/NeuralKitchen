-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."Prompt" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."Recipe" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."RecipeQueue" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."RecipeVersion" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."Tag" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."VecDocument" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "modifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeVersion" ADD CONSTRAINT "RecipeVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeVersion" ADD CONSTRAINT "RecipeVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeQueue" ADD CONSTRAINT "RecipeQueue_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeQueue" ADD CONSTRAINT "RecipeQueue_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VecDocument" ADD CONSTRAINT "VecDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VecDocument" ADD CONSTRAINT "VecDocument_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prompt" ADD CONSTRAINT "Prompt_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prompt" ADD CONSTRAINT "Prompt_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."RecipeQueue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortid" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RecipeQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sshPrivateKey" TEXT,
    "sshPublicKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_source_projects" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "includeGlobs" TEXT NOT NULL,
    "excludeGlobs" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "data_source_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_source_sync_jobs" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "filesFound" INTEGER,
    "filesImported" INTEGER,
    "filesUpdated" INTEGER,
    "filesSkipped" INTEGER,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "data_source_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_source_projects_dataSourceId_projectId_key" ON "public"."data_source_projects"("dataSourceId", "projectId");

-- AddForeignKey
ALTER TABLE "public"."data_sources" ADD CONSTRAINT "data_sources_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_sources" ADD CONSTRAINT "data_sources_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_projects" ADD CONSTRAINT "data_source_projects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_projects" ADD CONSTRAINT "data_source_projects_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_projects" ADD CONSTRAINT "data_source_projects_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_projects" ADD CONSTRAINT "data_source_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_sync_jobs" ADD CONSTRAINT "data_source_sync_jobs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_sync_jobs" ADD CONSTRAINT "data_source_sync_jobs_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_source_sync_jobs" ADD CONSTRAINT "data_source_sync_jobs_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

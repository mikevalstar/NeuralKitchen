import type { Prisma } from "../../generated/prisma/client";
import {
  type DataSourceInput,
  type DataSourceProjectInput,
  dataSourceInputSchema,
  dataSourceProjectInputSchema,
} from "../dataValidators";
import prisma from "../prisma";

export namespace DataSources {
  /**
   * Get all data sources, ordered by name
   */
  export async function list() {
    return prisma.dataSource.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        syncJobs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 1, // Get most recent sync job
        },
      },
    });
  }

  /**
   * Get a single data source by ID
   */
  export async function getById(id: string) {
    return prisma.dataSource.findFirst({
      where: {
        id,
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        syncJobs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 5, // Get recent sync jobs
        },
      },
    });
  }

  /**
   * Get active data sources by type
   */
  export async function getActiveByType(type: string) {
    return prisma.dataSource.findMany({
      where: {
        type,
        isActive: true,
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  /**
   * Create a new data source
   */
  export async function create(data: DataSourceInput, userId?: string) {
    // Validate the input
    const validatedData = dataSourceInputSchema.parse(data);

    // Check if data source already exists by name (case-insensitive)
    const existingDataSource = await prisma.dataSource.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
      },
    });

    if (existingDataSource) {
      throw new Error("Data source with this name already exists");
    }

    // For Git type, ensure repository URL is provided
    if (validatedData.type === "git" && !validatedData.config.repositoryUrl) {
      throw new Error("Repository URL is required for Git data sources");
    }

    return prisma.dataSource.create({
      data: {
        name: validatedData.name.trim(),
        type: validatedData.type,
        config: validatedData.config as Prisma.JsonObject,
        syncIntervalMinutes: validatedData.syncIntervalMinutes,
        sshPrivateKey: validatedData.sshPrivateKey,
        sshPublicKey: validatedData.sshPublicKey,
        createdBy: userId,
        modifiedBy: userId,
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        syncJobs: true,
      },
    });
  }

  /**
   * Update an existing data source
   */
  export async function update(id: string, data: Partial<DataSourceInput>, userId?: string) {
    // Check if the data source exists
    const existingDataSource = await getById(id);
    if (!existingDataSource) {
      throw new Error("Data source not found");
    }

    // If name is being updated, check for duplicates
    if (data.name) {
      const duplicateDataSource = await prisma.dataSource.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          NOT: {
            id: id,
          },
        },
      });

      if (duplicateDataSource) {
        throw new Error("Data source with this name already exists");
      }
    }

    // For Git type, ensure repository URL is provided if type is being set
    if ((data.type === "git" || existingDataSource.type === "git") && data.config) {
      const currentConfig = existingDataSource.config as Record<string, unknown>;
      const updatedConfig = { ...currentConfig, ...data.config };
      if (!updatedConfig.repositoryUrl) {
        throw new Error("Repository URL is required for Git data sources");
      }
    }

    return prisma.dataSource.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.type && { type: data.type }),
        ...(data.config && {
          config: {
            ...(existingDataSource.config as Record<string, unknown>),
            ...data.config,
          } as Prisma.JsonObject,
        }),
        ...(data.syncIntervalMinutes && { syncIntervalMinutes: data.syncIntervalMinutes }),
        ...(data.sshPrivateKey !== undefined && { sshPrivateKey: data.sshPrivateKey }),
        ...(data.sshPublicKey !== undefined && { sshPublicKey: data.sshPublicKey }),
        ...("isActive" in data && { isActive: data.isActive }),
        modifiedBy: userId,
        updatedAt: new Date(),
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        syncJobs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 5,
        },
      },
    });
  }

  /**
   * Delete a data source (hard delete)
   */
  export async function deleteDataSource(id: string) {
    // Check if the data source exists
    const existingDataSource = await getById(id);
    if (!existingDataSource) {
      throw new Error("Data source not found");
    }

    return prisma.dataSource.delete({
      where: { id },
    });
  }

  /**
   * Update sync status and timestamp
   */
  export async function updateSyncStatus(id: string, lastSyncAt?: Date, lastError?: string) {
    return prisma.dataSource.update({
      where: { id },
      data: {
        lastSyncAt,
        lastError,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get data sources that need syncing based on their interval
   */
  export async function getDataSourcesNeedingSync() {
    return prisma.dataSource.findMany({
      where: {
        isActive: true,
        OR: [
          // Never synced before
          {
            lastSyncAt: null,
          },
          // Last sync was longer ago than the sync interval
          {
            lastSyncAt: {
              lt: new Date(Date.now() - 60 * 1000), // At least 1 minute ago to avoid too frequent syncs
            },
          },
        ],
      },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  }
}

export namespace DataSourceProjects {
  /**
   * Get all data source projects, optionally filtered by data source
   */
  export async function list(dataSourceId?: string) {
    return prisma.dataSourceProject.findMany({
      where: dataSourceId ? { dataSourceId } : {},
      include: {
        dataSource: true,
        project: true,
      },
      orderBy: [
        {
          dataSource: {
            name: "asc",
          },
        },
        {
          project: {
            title: "asc",
          },
        },
      ],
    });
  }

  /**
   * Get data source projects for a specific data source
   */
  export async function getByDataSource(dataSourceId: string) {
    return prisma.dataSourceProject.findMany({
      where: {
        dataSourceId,
      },
      include: {
        project: true,
      },
      orderBy: {
        project: {
          title: "asc",
        },
      },
    });
  }

  /**
   * Create a new data source project relationship
   */
  export async function create(data: DataSourceProjectInput, userId?: string) {
    // Validate the input
    const validatedData = dataSourceProjectInputSchema.parse(data);

    // Check if the relationship already exists
    const existingRelationship = await prisma.dataSourceProject.findUnique({
      where: {
        dataSourceId_projectId: {
          dataSourceId: validatedData.dataSourceId,
          projectId: validatedData.projectId,
        },
      },
    });

    if (existingRelationship) {
      throw new Error("This project is already linked to the data source");
    }

    // Verify data source exists
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: validatedData.dataSourceId },
    });
    if (!dataSource) {
      throw new Error("Data source not found");
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    return prisma.dataSourceProject.create({
      data: {
        dataSourceId: validatedData.dataSourceId,
        projectId: validatedData.projectId,
        includeGlobs: validatedData.includeGlobs.trim(),
        excludeGlobs: validatedData.excludeGlobs?.trim() || "",
        isActive: validatedData.isActive,
        createdBy: userId,
        modifiedBy: userId,
      },
      include: {
        dataSource: true,
        project: true,
      },
    });
  }

  /**
   * Update an existing data source project relationship
   */
  export async function update(id: string, data: Partial<DataSourceProjectInput>, userId?: string) {
    // Check if the relationship exists
    const existingRelationship = await prisma.dataSourceProject.findUnique({
      where: { id },
    });
    if (!existingRelationship) {
      throw new Error("Data source project relationship not found");
    }

    return prisma.dataSourceProject.update({
      where: { id },
      data: {
        ...(data.includeGlobs && { includeGlobs: data.includeGlobs.trim() }),
        ...(data.excludeGlobs !== undefined && { excludeGlobs: data.excludeGlobs?.trim() || "" }),
        ...("isActive" in data && { isActive: data.isActive }),
        modifiedBy: userId,
        updatedAt: new Date(),
      },
      include: {
        dataSource: true,
        project: true,
      },
    });
  }

  /**
   * Delete a data source project relationship
   */
  export async function deleteRelationship(id: string) {
    // Check if the relationship exists
    const existingRelationship = await prisma.dataSourceProject.findUnique({
      where: { id },
    });
    if (!existingRelationship) {
      throw new Error("Data source project relationship not found");
    }

    return prisma.dataSourceProject.delete({
      where: { id },
    });
  }

  /**
   * Get projects that can be linked to a data source (not already linked)
   */
  export async function getAvailableProjects(dataSourceId: string) {
    const linkedProjectIds = await prisma.dataSourceProject.findMany({
      where: { dataSourceId },
      select: { projectId: true },
    });

    const linkedIds = linkedProjectIds.map((p) => p.projectId);

    return prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(linkedIds.length > 0 && {
          id: {
            notIn: linkedIds,
          },
        }),
      },
      orderBy: {
        title: "asc",
      },
    });
  }
}

export namespace DataSourceSyncJobs {
  /**
   * Create a new sync job
   */
  export async function create(dataSourceId: string, userId?: string) {
    // Verify data source exists
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    });
    if (!dataSource) {
      throw new Error("Data source not found");
    }

    return prisma.dataSourceSyncJob.create({
      data: {
        dataSourceId,
        status: "pending",
        createdBy: userId,
        modifiedBy: userId,
      },
      include: {
        dataSource: true,
      },
    });
  }

  /**
   * Update sync job status
   */
  export async function updateStatus(
    id: string,
    status: "pending" | "running" | "completed" | "failed",
    error?: string,
    completedAt?: Date,
    filesFound?: number,
    filesImported?: number,
    filesUpdated?: number,
    filesSkipped?: number,
  ) {
    return prisma.dataSourceSyncJob.update({
      where: { id },
      data: {
        status,
        error,
        completedAt,
        filesFound,
        filesImported,
        filesUpdated,
        filesSkipped,
      },
    });
  }

  /**
   * Get recent sync jobs across all data sources
   */
  export async function getRecent(limit: number = 10) {
    return prisma.dataSourceSyncJob.findMany({
      take: limit,
      orderBy: {
        startedAt: "desc",
      },
      include: {
        dataSource: true,
      },
    });
  }

  /**
   * Get sync jobs for a specific data source
   */
  export async function getByDataSource(dataSourceId: string, limit: number = 10) {
    return prisma.dataSourceSyncJob.findMany({
      where: {
        dataSourceId,
      },
      take: limit,
      orderBy: {
        startedAt: "desc",
      },
      include: {
        dataSource: true,
      },
    });
  }

  /**
   * Get currently running sync jobs
   */
  export async function getRunning() {
    return prisma.dataSourceSyncJob.findMany({
      where: {
        status: "running",
      },
      include: {
        dataSource: true,
      },
      orderBy: {
        startedAt: "asc",
      },
    });
  }

  /**
   * Mark a running job as failed if it's been running too long
   */
  export async function markStaleJobsAsFailed(timeoutMinutes: number = 30) {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    return prisma.dataSourceSyncJob.updateMany({
      where: {
        status: "running",
        startedAt: {
          lt: timeoutDate,
        },
      },
      data: {
        status: "failed",
        error: `Job timed out after ${timeoutMinutes} minutes`,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get sync job statistics for a data source
   */
  export async function getStats(dataSourceId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const jobs = await prisma.dataSourceSyncJob.findMany({
      where: {
        dataSourceId,
        startedAt: {
          gte: since,
        },
      },
    });

    return {
      total: jobs.length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      running: jobs.filter((j) => j.status === "running").length,
      pending: jobs.filter((j) => j.status === "pending").length,
      totalFilesFound: jobs.reduce((sum, j) => sum + (j.filesFound || 0), 0),
      totalFilesImported: jobs.reduce((sum, j) => sum + (j.filesImported || 0), 0),
      totalFilesUpdated: jobs.reduce((sum, j) => sum + (j.filesUpdated || 0), 0),
      totalFilesSkipped: jobs.reduce((sum, j) => sum + (j.filesSkipped || 0), 0),
    };
  }
}

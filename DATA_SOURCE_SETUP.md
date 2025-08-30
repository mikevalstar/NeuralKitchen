# Data Source Configuration Setup

## Environment Variables

Add the following environment variables to your `.env` file to enable data source functionality:

```bash
# Data Source Sync Configuration
DATA_SYNC_FOLDER="/absolute/path/to/sync/folder"
DATA_SYNC_MAX_CONCURRENT="3"
```

### Variable Descriptions

- **DATA_SYNC_FOLDER**: Absolute path where Git repositories will be cloned and synced. This folder will be created if it doesn't exist.
  - Default: `{project_root}/data-sync` (if not specified)
  - Example: `/Users/yourname/projects/neuralkitchen-data-sync`

- **DATA_SYNC_MAX_CONCURRENT**: Maximum number of concurrent sync jobs that can run simultaneously.
  - Default: `3`
  - Range: `1-10`

## System Requirements

Before using data source functionality, ensure you have:

1. **Git CLI**: The system requires Git to be installed and accessible via command line
   ```bash
   # Check if Git is installed
   git --version
   ```

2. **File System Permissions**: The DATA_SYNC_FOLDER path must be:
   - Writable by the application
   - Have sufficient disk space for repository clones
   - Accessible by the Node.js process

## First-Time Setup

1. Create your sync folder:
   ```bash
   mkdir -p /path/to/your/sync/folder
   chmod 755 /path/to/your/sync/folder
   ```

2. Add the environment variables to your `.env` file

3. Restart your development server:
   ```bash
   pnpm dev
   ```

## Security Notes

- SSH private keys are stored Base64-encoded in the database (TODO: Add encryption at rest for enhanced security)
- Temporary SSH key files are created during sync operations and cleaned up automatically
- Repository URLs are validated before processing
- All file operations are sandboxed within the DATA_SYNC_FOLDER

## Phase 1 Status - COMPLETE! ✅

✅ **Completed**:
- **Database Schema**: Added 3 new models (DataSource, DataSourceProject, DataSourceSyncJob) with proper relationships
- **Migration**: Successfully created and applied migration `20250830185150_add_data_sources`
- **Data Access Layer**: Complete CRUD operations in `src/lib/data/dataSources.ts`:
  - `DataSources` namespace with list, create, update, delete, getById, getActiveByType operations
  - `DataSourceProjects` namespace for managing project relationships
  - `DataSourceSyncJobs` namespace for sync job lifecycle management
- **Validation Schemas**: Added comprehensive Zod schemas in `dataValidators.ts`:
  - `DataSourceInput` with Git config validation and SSH key support
  - `DataSourceProjectInput` with glob pattern validation
  - `DataSourceSyncJobInput` with status tracking
- **Queue Integration**: Extended `queueProcessor.ts` to handle data source sync jobs alongside recipe processing
- **TypeScript Compliance**: All code passes type checking and Biome linting
- **Environment Configuration**: Documented required environment variables

**Technical Details**:
- SSH keys stored Base64-encoded (TODO: encryption at rest)
- Many-to-many relationship between data sources and projects with glob patterns
- Sync job tracking with detailed statistics (files found/imported/updated/skipped)
- Queue processor ready for Phase 4 sync logic implementation
- Git CLI dependency documented (system Git required)

🚀 **Ready for Phase 2**: User Interface - Management
- Data source listing and management pages
- Forms for creating and editing data sources  
- SSH key input/generation components
- Project integration settings UI
- Real-time status monitoring components
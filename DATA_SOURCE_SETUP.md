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

## Phase 2 Status - COMPLETE! ✅

✅ **User Interface - Management**:
- **Data Sources Listing Page** (`/data-sources`): Complete data source overview with cards showing status, sync info, and actions
- **Create Data Source Form**: Comprehensive form with Git configuration, SSH key management, and sync interval settings
- **Data Source Detail View** (`/data-sources/$id`): Full detail page with configuration, linked projects, sync history table
- **Edit Data Source Form** (`/data-sources/$id/edit`): Update configuration with proper form validation and state management
- **Navigation Integration**: Added "Data Sources" to main navigation menu with Database icon
- **Status Indicators**: Real-time sync status with loading, success, error, and never-synced states
- **SSH Key Input**: Secure SSH key management with private/public key fields
- **Responsive Design**: Mobile-friendly layouts with proper grid systems

**Technical Implementation**:
- TanStack Form integration with Zod validation
- Server functions for all CRUD operations
- TypeScript type safety with JSON config handling
- Toast notifications for user feedback
- Breadcrumb navigation for nested pages
- Table components for sync history display
- Badge components for status indicators
- Proper error handling and loading states

**UI Components Created**:
- Data source cards with status and actions
- Collapsible create/edit forms
- SSH key configuration sections
- Sync history tables with duration calculations
- Project linking interface (placeholder for Phase 3)
- Delete confirmation dialogs
- Manual sync trigger buttons

🚀 **Ready for Phase 3**: Git Integration Core
- Git repository cloning and pulling
- SSH key authentication implementation
- File discovery with glob patterns
- Content parsing and recipe creation
- Error handling for Git operations

## Phase 2 Status - COMPLETE! ✅ (Updated)

✅ **User Interface - Management (All Features Complete)**:
- **Data Sources Listing Page** (`/data-sources`): Complete data source overview with cards showing status, sync info, and actions
- **Create Data Source Form** (`/data-sources/new`): Comprehensive form with Git configuration, SSH key management, and sync interval settings
- **Data Source Detail View** (`/data-sources/$id`): Full detail page with configuration, linked projects, sync history table
- **Edit Data Source Form** (`/data-sources/$id/edit`): Update configuration with proper form validation and state management
- **🆕 Project Management Page** (`/data-sources/$id/projects`): Complete project linking interface with:
  - View all linked projects with their glob patterns
  - Link new projects with include/exclude glob configuration
  - Edit existing project configurations (glob patterns, active status)
  - Unlink projects with confirmation dialogs
  - Form validation and error handling
- **Navigation Integration**: Added "Data Sources" to main navigation menu with Database icon
- **Status Indicators**: Real-time sync status with loading, success, error, and never-synced states
- **SSH Key Input**: Secure SSH key management with private/public key fields
- **Responsive Design**: Mobile-friendly layouts with proper grid systems

**Phase 2 Technical Implementation (All Complete)**:
- TanStack Form integration with Zod validation across all forms
- Server functions for all CRUD operations (data sources and project linking)
- TypeScript type safety with JSON config handling
- Toast notifications for user feedback across all operations
- Breadcrumb navigation for nested pages
- Table components for sync history display
- Badge components for status indicators
- Proper error handling and loading states throughout
- Comprehensive project linking functionality with glob pattern support

**UI Components Created (All Complete)**:
- Data source cards with status and actions
- Collapsible create/edit forms for data sources
- SSH key configuration sections
- Sync history tables with duration calculations
- **🆕 Complete project linking interface**:
  - Project selection dropdown with available projects
  - Glob pattern input/editing with textarea controls
  - Project configuration cards with edit/delete actions
  - Confirmation dialogs for destructive actions
  - Active/inactive status toggles
- Delete confirmation dialogs
- Manual sync trigger buttons (placeholder functionality)

**Known Issues (Non-blocking)**:
- Some TypeScript warnings for `any` types in config JSON handling (acceptable for current phase)
- Manual sync triggers create database entries but don't perform actual sync (Phase 4 functionality)
# Neural Kitchen - Project Plan: Document Sync System

## Overview

Neural Kitchen is expanding to include automated document synchronization from external sources (Git repositories, Confluence, etc.). This system will allow teams to automatically import and maintain recipes from their existing documentation and code repositories while maintaining quality control through approval workflows.

**Current Status**: Core recipe system complete. Ready to build sync infrastructure.

---

## Phase 1: Sync Infrastructure Foundation 🏗️
*Goal: Build the core sync system architecture and database models*

### 1.1 Database Schema Extensions

**Schema Changes Needed:**
- [ ] **SyncSource Model** - External source configurations
  ```sql
  - id (uuid)
  - name (string) - "Company Wiki", "Main Repo"
  - type (string) - "git", "confluence", etc. (plugin identifier)
  - isActive (boolean)
  - config (json) - all configuration including base + plugin-specific settings
  - scheduleExpression (string) - cron expression
  - lastSyncAt (datetime)
  - nextSyncAt (datetime)
  - createdBy/modifiedBy (user relations)
  - createdAt/updatedAt/deletedAt
  ```

  **Base Config Schema (Zod):**
  ```typescript
  // All plugins extend this base configuration
  const BaseSyncConfigSchema = z.object({
    // Approval settings
    autoApprove: z.boolean().default(false),
    
    // File filtering
    include: z.string().default("**/*"), // glob pattern
    exclude: z.string().default(""), // glob pattern, comma separated
    autoPublishGlob: z.string().default(""), // comma separated globs for auto-publish
    
    // Project assignment
    defaultProjects: z.array(z.string()).default([]), // project IDs to auto-assign
    
    // Content processing
    titleExtraction: z.enum(["filename", "first-heading", "frontmatter"]).default("first-heading"),
    preserveFrontmatter: z.boolean().default(true),
    
    // Sync behavior
    maxFileSize: z.number().default(1024 * 1024), // 1MB default
    skipBinaryFiles: z.boolean().default(true)
  });
  
  // Plugin-specific configs extend this base
  const GitSyncConfigSchema = BaseSyncConfigSchema.extend({
    repositoryUrl: z.string().url(),
    branch: z.string().default("main"),
    authToken: z.string().optional(),
    clonePath: z.string().optional() // local clone directory
  });
  ```

- [ ] **SyncDocument Model** - Tracked external documents
  ```sql
  - id (uuid)
  - sourceId (uuid) -> SyncSource
  - externalId (string) - source's document ID
  - externalPath (string) - file path or URL
  - title (string)
  - lastExternalHash (string) - detect changes
  - status (enum) - "pending", "approved", "rejected", "synced"
  - approvedBy (user ID)
  - approvedAt (datetime)
  - rejectedReason (string)
  - recipeId (uuid) - linked recipe (nullable)
  - isDeleted (boolean) - document deleted from source
  - createdAt/updatedAt
  ```

- [ ] **Recipe Schema Updates**
  ```sql
  - syncedFrom (uuid) -> SyncSource (nullable)
  - externalId (string) - source document ID (nullable)
  - isExternallyManaged (boolean) - prevent manual edits (always true for synced recipes)
  - syncedFromPath (string) - original file path or URL for display
  ```

**Todo Items:**
- [ ] Create Prisma migration for SyncSource model
- [ ] Create Prisma migration for SyncDocument model  
- [ ] Add Recipe foreign key fields migration (including syncedFromPath)
- [ ] Update Prisma client generation
- [ ] Create data access layer: `SyncSources` namespace
- [ ] Create data access layer: `SyncDocuments` namespace
- [ ] Add validation to prevent manual edits of synced recipes

### 1.2 Plugin System Architecture

**Core Plugin Framework:**
- Pluggable sync adapter architecture as the foundation
- Dynamic adapter registration and discovery
- Standardized plugin interface and lifecycle
- Base configuration schema with Zod validation that all plugins extend
- Plugin-specific configuration schemas that extend the base
- Plugin validation and error handling

**Todo Items:**
- [ ] Create base `SyncPlugin` interface with standard methods
- [ ] Create `PluginRegistry` for dynamic plugin management
- [ ] Create `BaseSyncConfigSchema` with Zod validation
- [ ] Implement plugin configuration validation system (base + plugin-specific)
- [ ] Create plugin lifecycle management (init, validate, sync, cleanup)
- [ ] Add plugin-specific error handling and logging
- [ ] Create plugin development utilities and helpers
- [ ] Design plugin configuration UI framework with base config support

### 1.3 Core Sync Engine

**Architecture:**
- Background job system (extend existing queue)
- Plugin-based sync execution
- Change detection and conflict resolution
- Approval workflow integration

**Todo Items:**
- [ ] Create `SyncEngine` class that orchestrates plugins
- [ ] Create `SyncJob` queue type (extend existing queue system)
- [ ] Implement change detection logic (hash comparison)
- [ ] Create sync result data structures
- [ ] Add sync jobs to background processor
- [ ] Integrate plugin system with sync engine

### 1.4 Approval Workflow System

**Features:**
- Pending document review queue
- Bulk approval operations
- Auto-approval based on source settings
- Rejection with reason tracking
- Read-only enforcement for synced recipes

**Todo Items:**
- [ ] Create approval workflow data layer
- [ ] Create admin UI for pending documents
- [ ] Implement bulk approval operations
- [ ] Create approval notification system
- [ ] Add approval status tracking
- [ ] Implement read-only enforcement for synced recipes
- [ ] Add sync source display in recipe UI

---

## Phase 2: Core Plugins Development 🔄
*Goal: Build Git and Confluence plugins as reference implementations*

### 2.1 Git Repository Plugin

**Plugin Implementation:**
- Implements standard `SyncPlugin` interface
- Git-specific configuration schema and validation
- Repository management and file processing
- Integration with plugin registry

**Features:**
- Clone and pull repositories
- File filtering with glob patterns
- Branch selection
- Commit tracking for change detection
- Support for GitHub, GitLab, Bitbucket URLs

**Todo Items:**
- [ ] Install Git dependencies (`simple-git` npm package)
- [ ] Create `GitSyncPlugin` class implementing `SyncPlugin` interface
- [ ] Define `GitSyncConfigSchema` extending `BaseSyncConfigSchema`
- [ ] Implement Git config validation (base + Git-specific fields)
- [ ] Implement plugin lifecycle methods (validate, sync, cleanup)
- [ ] Add repository cloning/pulling logic
- [ ] Implement file filtering using base config include/exclude patterns
- [ ] Add change detection via commit SHAs
- [ ] Create Git-specific error handling
- [ ] Register Git plugin with plugin system

### 2.2 Shared Content Processing

**Plugin Utilities:**
- Shared content processing utilities for all plugins
- Standardized content transformation pipeline
- Common validation and sanitization

**Features:**
- Parse frontmatter for metadata
- Extract title from first heading or filename
- Handle relative links and images
- Support for different markdown flavors
- HTML to Markdown conversion utilities

**Todo Items:**
- [ ] Install content processing dependencies (`gray-matter`, `unified`, `turndown`)
- [ ] Create shared `ContentProcessor` utility class
- [ ] Implement frontmatter extraction utilities
- [ ] Add title detection logic
- [ ] Create content transformation pipeline
- [ ] Handle image and link resolution
- [ ] Add markdown validation utilities
- [ ] Create HTML to Markdown conversion tools

### 2.3 Plugin Configuration UI Framework

**Framework Features:**
- Dynamic configuration forms based on plugin schemas
- Plugin-agnostic source management interface
- Standardized test connection functionality
- Generic sync status and history display

**Git Plugin UI:**
- Git repository configuration form
- Repository validation and testing
- Branch and file pattern configuration

**Todo Items:**
- [ ] Create plugin configuration form framework
- [ ] Build dynamic form generator from Zod schemas (base + plugin-specific)
- [ ] Create base configuration UI components (include/exclude, auto-approval, etc.)
- [ ] Create generic source management interface
- [ ] Implement plugin-agnostic test connection system
- [ ] Add sync status dashboard framework
- [ ] Create sync history viewer component
- [ ] Implement Git plugin configuration UI (base + Git fields)
- [ ] Add Git repository validation endpoints

---

## Phase 3: Confluence Plugin Development 🌐
*Goal: Add Confluence as the second reference plugin*

### 3.1 Confluence Plugin Implementation

**Plugin Implementation:**
- Implements standard `SyncPlugin` interface
- Confluence-specific configuration and validation
- Leverages shared content processing utilities
- Full integration with plugin system

**Features:**
- Confluence REST API integration
- Space and page filtering
- Authentication (API tokens, OAuth)
- HTML to Markdown conversion (using shared utilities)
- Attachment handling

**Todo Items:**
- [ ] Install Confluence API client
- [ ] Create `ConfluenceSyncPlugin` class implementing `SyncPlugin` interface
- [ ] Define `ConfluenceSyncConfigSchema` extending `BaseSyncConfigSchema`
- [ ] Implement Confluence config validation (base + Confluence-specific fields)
- [ ] Implement plugin lifecycle methods
- [ ] Add Confluence authentication flow
- [ ] Implement space/page discovery with base config filtering
- [ ] Integrate with shared HTML to Markdown converter
- [ ] Add change detection via version numbers
- [ ] Implement attachment download logic
- [ ] Register Confluence plugin with plugin system

### 3.2 Confluence-Specific Processing

**Features:**
- Convert Confluence markup to Markdown (extends shared utilities)
- Handle Confluence macros
- Extract page metadata
- Process page hierarchies

**Todo Items:**
- [ ] Extend shared ContentProcessor for Confluence specifics
- [ ] Create Confluence macro conversion rules
- [ ] Add page hierarchy mapping
- [ ] Create Confluence metadata extraction
- [ ] Handle Confluence-specific content types
- [ ] Add Confluence content sanitization rules

### 3.3 Confluence Plugin UI

**Features:**
- Confluence configuration using plugin UI framework
- Space and page selection interface
- Preview converted content
- Authentication setup flow

**Todo Items:**
- [ ] Implement Confluence configuration form using framework (base + Confluence fields)
- [ ] Add space/page browser component with base config filtering
- [ ] Create Confluence authentication UI
- [ ] Add content preview functionality
- [ ] Implement Confluence-specific validation
- [ ] Create Confluence connection testing

---

## Phase 4: Advanced Sync Features 🚀
*Goal: Add enterprise-grade sync capabilities and monitoring*

### 4.1 Enhanced Scheduling

**Features:**
- Advanced cron expressions
- Manual sync triggers
- Sync prioritization
- Retry logic with backoff

**Todo Items:**
- [ ] Implement advanced scheduler
- [ ] Add manual sync triggers
- [ ] Create sync priority queuing
- [ ] Implement retry mechanisms
- [ ] Add sync timeout handling
- [ ] Create scheduling UI

### 4.2 Sync Status & Source Display

**Features:**
- Display sync source information in recipe UI
- Show last sync timestamp and status
- Indicate read-only status for synced recipes
- Link to original source document
- Sync history and change tracking

**Todo Items:**
- [ ] Add sync source display components
- [ ] Create "View Original" links to external sources
- [ ] Implement sync status indicators
- [ ] Add sync history viewer
- [ ] Create read-only recipe UI treatment
- [ ] Add "Synced from" badges and metadata display

### 4.3 Sync Monitoring & Analytics

**Features:**
- Sync success/failure metrics
- Performance monitoring
- Sync frequency analytics
- Error alerting system

**Todo Items:**
- [ ] Create sync metrics collection
- [ ] Build monitoring dashboard
- [ ] Implement error alerting
- [ ] Add performance tracking
- [ ] Create sync analytics views
- [ ] Implement health checks

### 4.4 Bulk Operations

**Features:**
- Bulk source configuration
- Mass approval workflows
- Batch sync operations
- Template-based source creation

**Todo Items:**
- [ ] Create bulk configuration UI
- [ ] Implement mass approval system
- [ ] Add batch sync operations
- [ ] Create source templates
- [ ] Implement bulk validation
- [ ] Add progress tracking for bulk ops

---

## Phase 5: Extended Plugin Ecosystem 🔌
*Goal: Expand plugin ecosystem and enable third-party development*

### 5.1 Additional Core Plugins

**Planned Plugins:**
- [ ] **Notion Plugin** - Notion workspace sync
- [ ] **SharePoint Plugin** - SharePoint document libraries
- [ ] **Slack Plugin** - Slack channel messages/threads
- [ ] **Google Docs Plugin** - Google Drive documents
- [ ] **Jira Plugin** - Jira project documentation
- [ ] **Linear Plugin** - Linear project docs
- [ ] **File System Plugin** - Local directory sync

**Todo Items (per plugin):**
- [ ] Research API capabilities and limitations
- [ ] Create plugin implementation using standard interface
- [ ] Define plugin-specific configuration schema
- [ ] Implement plugin UI using framework
- [ ] Add authentication flow
- [ ] Leverage shared content transformation utilities
- [ ] Create plugin-specific testing and validation
- [ ] Register plugin with plugin system

### 5.2 Third-Party Plugin Support

**Features:**
- Plugin SDK for external developers
- Plugin validation and security
- Plugin marketplace/registry
- Plugin documentation and examples

**Todo Items:**
- [ ] Create comprehensive plugin SDK with base config utilities
- [ ] Build plugin development documentation including base config usage
- [ ] Create plugin template/boilerplate with base config extension example
- [ ] Implement plugin security validation including config schema validation
- [ ] Add plugin marketplace infrastructure
- [ ] Create plugin testing framework with config validation tests
- [ ] Build plugin distribution system

---

## Development Principles

### Quality & Reliability
- All sync operations must be idempotent
- Comprehensive error handling and recovery
- Transaction safety for database operations
- Extensive logging for debugging

### Security & Privacy
- Secure credential storage (encrypted)
- Rate limiting for external APIs
- Input validation and sanitization
- Audit trails for sync operations

### Performance & Scalability
- Async processing for all sync operations
- Efficient change detection algorithms
- Configurable sync batch sizes
- Resource usage monitoring

### User Experience
- Clear sync status indicators
- Intuitive approval workflows
- Helpful error messages
- Comprehensive documentation
- Clear read-only indicators for synced content
- Easy access to original source locations

---

## Implementation Notes

### Database Considerations
- Use existing soft delete pattern for sync-related models
- Leverage existing user tracking for all sync operations
- Extend existing queue system rather than creating new one
- Maintain referential integrity with cascade deletes
- Store plugin configurations as JSON with base + plugin-specific Zod validation
- Base config schema provides common sync behavior across all plugins

### Integration Points
- Extend existing MCP server to expose sync status and plugin information
- Use existing authentication system for sync permissions
- Leverage existing vector search for synced content
- Integrate with existing project/tag system
- Modify recipe edit forms to prevent changes to synced recipes
- Add sync source information to recipe display components
- Plugin system integrates with existing queue and background processing
- Plugin configurations stored in existing settings system

### Migration Strategy
- Plan schema migrations carefully to avoid downtime
- Create migration rollback procedures
- Test migrations on production-like data
- Document all schema changes

### Security Requirements
- Store API credentials encrypted at rest
- Use secure HTTP clients for external requests
- Implement proper CORS for sync endpoints
- Add rate limiting to prevent abuse
- Plugin validation and sandboxing to prevent malicious plugins
- Secure plugin configuration storage with encryption

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] Plugin system architecture is fully functional
- [ ] Plugin registry manages plugin lifecycle
- [ ] Database schema supports all sync operations
- [ ] Core sync engine processes documents via plugins
- [ ] Approval workflow handles pending documents
- [ ] Admin UI allows plugin-based source management

### Phase 2 Success Criteria  
- [ ] Git plugin integrates seamlessly with plugin system
- [ ] Plugin configuration UI framework works generically
- [ ] Git repositories sync successfully via plugin
- [ ] Shared content processing utilities work across plugins
- [ ] File filtering works with glob patterns
- [ ] Change detection triggers updates correctly

### Phase 3 Success Criteria
- [ ] Confluence plugin demonstrates plugin system maturity
- [ ] Two different plugins (Git + Confluence) work seamlessly
- [ ] Confluence spaces sync completely via plugin
- [ ] Shared HTML to Markdown conversion works across plugins
- [ ] Authentication works for Cloud/Server
- [ ] Page hierarchies maintain structure

### Overall Success Criteria
- [ ] Plugin system enables easy addition of new sources
- [ ] Teams can sync 1000+ documents reliably via plugins
- [ ] Sync operations complete within reasonable time
- [ ] Error rates stay below 1% for active sources
- [ ] User approval workflows reduce manual work by 80%
- [ ] Third-party developers can create plugins with provided SDK

---

*This plan builds upon Neural Kitchen's existing foundation while adding powerful document synchronization capabilities. Each phase delivers immediate value while setting up the next phase for success.*
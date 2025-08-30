# External Data Sources Implementation Plan

## Overview
Add external data source integration to Neural Kitchen, starting with Git repositories. This will allow automatic syncing of code files into the recipe system based on configurable glob patterns, with future extensibility for sources like Confluence.

## Architecture Overview
- **Data Source Types**: Git (initial), extensible for Confluence/others
- **Sync Process**: Background jobs pull latest code, filter by globs, auto-import to projects  
- **Storage**: Local sync folder (env configured), database tracking of sources/status
- **Security**: Optional SSH key management for private repositories
- **UI**: Management interface for configuration, monitoring, and status

---

## Phase 1: Foundation & Database Schema
**Goal**: Set up core data models and background job infrastructure

### Database Schema Updates
**File**: `prisma/schema.prisma`

```prisma
model DataSource {
  id              String   @id @default(cuid())
  name            String
  type            String   // "git", "confluence", etc
  config          Json     // Flexible config for different source types
  isActive        Boolean  @default(true)
  syncIntervalMinutes Int  @default(60) // How often to sync in minutes
  lastSyncAt      DateTime?
  lastError       String?
  
  // SSH Key fields (stored directly on data source)
  // TODO: Add encryption at rest for enhanced security
  sshPrivateKey   String?  // Base64 encoded private key
  sshPublicKey    String?  // Base64 encoded public key
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relationships
  projects        DataSourceProject[]
  syncJobs        DataSourceSyncJob[]
  
  @@map("data_sources")
}

model DataSourceProject {
  id           String @id @default(cuid())
  dataSourceId String
  projectId    String
  includeGlobs String // Comma/newline separated
  excludeGlobs String // Comma/newline separated
  isActive     Boolean @default(true)
  
  dataSource DataSource @relation(fields: [dataSourceId], references: [id], onDelete: Cascade)
  project    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([dataSourceId, projectId])
  @@map("data_source_projects")
}

model DataSourceSyncJob {
  id           String   @id @default(cuid())
  dataSourceId String
  status       String   // "pending", "running", "completed", "failed"
  startedAt    DateTime @default(now())
  completedAt  DateTime?
  error        String?
  filesFound   Int?
  filesImported Int?
  
  dataSource DataSource @relation(fields: [dataSourceId], references: [id], onDelete: Cascade)
  
  @@map("data_source_sync_jobs")
}
```

### Environment Configuration
**File**: `.env` (add new variables)
```
# Data Source Sync Configuration (absolute path)
DATA_SYNC_FOLDER="/absolute/path/to/sync/folder"
```

### Data Access Layer
**File**: `src/lib/data/DataSources.ts` (new)
```typescript
export namespace DataSources {
  export async function list()
  export async function create(data: DataSourceInput)
  export async function update(id: string, data: Partial<DataSourceInput>)
  export async function delete(id: string)
  export async function getById(id: string)
  export async function getActiveByType(type: string)
}

export namespace DataSourceProjects {
  export async function list(dataSourceId?: string)
  export async function create(data: DataSourceProjectInput)
  export async function update(id: string, data: Partial<DataSourceProjectInput>)
  export async function delete(id: string)
  export async function getByDataSource(dataSourceId: string)
}

export namespace DataSourceSyncJobs {
  export async function create(dataSourceId: string)
  export async function updateStatus(id: string, status: string, error?: string)
  export async function getRecent(limit: number)
  export async function getByDataSource(dataSourceId: string, limit: number)
}
```

### Validation Schemas
**File**: `src/lib/dataValidators.ts` (additions)
```typescript
export const DataSourceInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["git", "confluence"]),
  syncIntervalMinutes: z.number().min(5).max(1440).default(60), // 5 min to 24 hours
  config: z.object({
    // Git specific
    repositoryUrl: z.string().url().optional(),
    branch: z.string().default("main").optional(),
    // Extensible for other types
  }),
  sshPrivateKey: z.string().optional(),
  sshPublicKey: z.string().optional()
})

export const DataSourceProjectInputSchema = z.object({
  dataSourceId: z.string(),
  projectId: z.string(),
  includeGlobs: z.string(),
  excludeGlobs: z.string().optional(),
  isActive: z.boolean().default(true)
})
```

### Migration
**Command**: `pnpx prisma migrate dev --name add_data_sources`

### Tasks
- [ ] Update Prisma schema with new models
- [ ] Add corresponding relationship field to Project model (dataSources: DataSourceProject[])
- [ ] Generate and run migration
- [ ] Create data access layer functions
- [ ] Add validation schemas
- [ ] Update environment configuration

---

## Phase 2: User Interface - Management  
**Goal**: Create UI for configuring and managing data sources (build first for easier testing)

### Data Source Management Page
**File**: `src/routes/data-sources/index.tsx` (new)
```tsx
// Main data sources list/management page
// Features:
// - List all configured data sources
// - Add new data source button
// - Status indicators (last sync, health)
// - Quick actions (sync now, edit, delete)
// - Sync history summary
```

### Data Source Form/Editor
**File**: `src/routes/data-sources/new.tsx` (new)
**File**: `src/routes/data-sources/$id/edit.tsx` (new)
```tsx
// Data source creation/editing form
// Features:
// - Source type selection (Git initially)
// - Repository URL input with validation
// - Branch selection
// - SSH key management (upload/generate)
// - Connection testing
// - Name/description fields
```

### Project Integration Settings
**File**: `src/routes/data-sources/$id/projects.tsx` (new)
```tsx
// Configure which projects sync from this data source
// Features:
// - Project selection checkboxes
// - Include/exclude glob configuration per project
// - Glob pattern validation and preview
// - Test glob patterns against sample files
```

### SSH Key Input Component
**File**: `src/components/data-sources/SSHKeyInput.tsx` (new)
```tsx
// SSH key input/generation component (used in data source forms)
// Features:
// - Manual SSH key paste/input
// - Generate new key pairs
// - Validate key format
// - Show public key preview
// - Clear/reset keys
```

### Components
**File**: `src/components/data-sources/DataSourceCard.tsx` (new)
**File**: `src/components/data-sources/SyncStatus.tsx` (new)
**File**: `src/components/data-sources/GlobPatternInput.tsx` (new)
**File**: `src/components/data-sources/SSHKeyInput.tsx` (new)

### Server Functions
**File**: `src/routes/data-sources/_server-functions.ts` (new)
```typescript
export const getDataSources = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure]) // Any authenticated user can manage data sources
  .handler(async () => DataSources.list())

export const createDataSource = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure]) // Any authenticated user can create data sources
  .validator(DataSourceInputSchema)
  .handler(async ({ data }) => DataSources.create(data))

export const updateDataSource = createServerFn({ method: "PUT" })
  .middleware([authMiddlewareEnsure]) // Any authenticated user can update their data sources
  .validator(DataSourceInputSchema.partial())
  .handler(async ({ data, params }) => DataSources.update(params.id, data))

export const testConnection = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .handler(async ({ data }) => {
    // Test git connection without saving
  })

export const triggerSync = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .handler(async ({ params }) => {
    // Manually trigger sync for data source
  })
```

### Tasks
- [ ] Create data source listing and management page
- [ ] Build form components for source configuration
- [ ] Implement project integration settings UI
- [ ] Create SSH key input/generation component
- [ ] Create reusable components for status, globs, etc.
- [ ] Implement server functions for all operations
- [ ] Add form validation and error handling
- [ ] Create responsive design for mobile

---

## Phase 3: Git Integration Core
**Goal**: Implement Git repository cloning, pulling, and file discovery

### Git Service Implementation
**File**: `src/lib/services/gitService.ts` (new)
```typescript
// Uses system Git CLI - requires Git to be installed
export class GitService {
  constructor(private syncFolder: string)
  
  async cloneRepository(config: GitConfig, targetDir: string): Promise<void>
  async pullLatest(repoPath: string): Promise<void>
  async getRepositoryStatus(repoPath: string): Promise<GitStatus>
  async findFiles(repoPath: string, includeGlobs: string[], excludeGlobs: string[]): Promise<string[]>
  
  private async ensureSyncFolder(): Promise<void>
  private parseGlobs(globString: string): string[]
  private sanitizeRepoName(url: string): string
  private async executeGitCommand(args: string[], cwd?: string): Promise<string>
  private async setupSSHKey(sshKey: string): Promise<string> // Returns temp key file path
  private async cleanupSSHKey(keyPath: string): Promise<void>
}

interface GitConfig {
  repositoryUrl: string
  branch: string
  sshPrivateKey?: string
}

interface GitStatus {
  currentBranch: string
  lastCommit: string
  lastCommitDate: Date
  isDirty: boolean
}
```

### SSH Key Service (utilities only, keys stored in DB)
**File**: `src/lib/services/sshKeyService.ts` (new)
```typescript
export class SSHKeyService {
  // Utilities for SSH key operations (validation, generation)
  // Uses system ssh-keygen CLI for key operations
  async validateSSHKey(privateKey: string): Promise<boolean>
  async generateKeyPair(): Promise<{ privateKey: string, publicKey: string }>
  async extractPublicKey(privateKey: string): Promise<string>
  
  // Encoding/decoding for database storage
  // TODO: Add encryption at rest for enhanced security
  encodeKeyForStorage(key: string): string
  decodeKeyFromStorage(encodedKey: string): string
  
  private validateKeyFormat(key: string): boolean
  private async executeSSHKeygen(args: string[]): Promise<string>
}
```

### File Processing Service
**File**: `src/lib/services/fileProcessingService.ts` (new)
```typescript
export class FileProcessingService {
  async processDiscoveredFiles(
    files: string[], 
    repoPath: string, 
    projectId: string,
    dataSourceId: string
  ): Promise<{ imported: number, skipped: number, updated: number, errors: string[] }>
  
  private async shouldImportFile(filePath: string, content: string): Promise<boolean>
  private async createOrUpdateRecipeFromFile(filePath: string, content: string, projectId: string): Promise<'created' | 'updated' | 'skipped'>
  private extractMetadataFromFile(filePath: string, content: string): FileMetadata
  private extractFrontmatter(content: string): { metadata: any, content: string }
  private generateTitleFromPath(filePath: string): string
  private findExistingRecipeBySourcePath(filePath: string, projectId: string): Promise<Recipe | null>
}

interface FileMetadata {
  title: string
  description?: string
  tags: string[]
  language?: string
  sourcePath: string // Track source file path for updates
}
```

### Queue Integration
**File**: `src/lib/services/queueService.ts` (update existing)
```typescript
// Add new queue types (update existing string-based system)
// "data_source_sync", "data_source_discovery"

// Add new job handlers
private async processDataSourceSync(job: QueueJob): Promise<void>
private async processDataSourceDiscovery(job: QueueJob): Promise<void>
```

### Tasks
- [ ] Implement GitService for repository operations
- [ ] Create SSHKeyService utilities (keys stored in DB now)
- [ ] Build FileProcessingService for content import
- [ ] Extend QueueService with data source job types
- [ ] Add comprehensive error handling and logging
- [ ] Create utility functions for glob matching

---

## Phase 4: Background Job Scheduler
**Goal**: Implement periodic syncing and job orchestration

### Sync Scheduler Service
**File**: `src/lib/services/syncSchedulerService.ts` (new)
```typescript
export class SyncSchedulerService {
  private intervalId?: NodeJS.Timeout
  private isRunning = false
  
  start(): void
  stop(): void
  
  async scheduleSync(dataSourceId: string): Promise<void>
  async runSync(dataSourceId: string): Promise<DataSourceSyncJob>
  
  private async processAllActiveSources(): Promise<void>
  private async processSingleSource(dataSource: DataSource): Promise<void>
  private async shouldSync(dataSource: DataSource): Promise<boolean>
  private calculateNextSyncTime(lastSync?: Date, intervalMinutes: number): Date
}
```

### Sync Orchestration
**File**: `src/lib/services/syncOrchestrator.ts` (new)
```typescript
export class SyncOrchestrator {
  constructor(
    private gitService: GitService,
    private fileProcessingService: FileProcessingService,
    private sshKeyService: SSHKeyService
  )
  
  async executeSyncJob(dataSource: DataSource): Promise<SyncResult>
  
  private async syncGitRepository(dataSource: DataSource): Promise<SyncResult>
  private async discoverAndProcessFiles(
    repoPath: string, 
    dataSource: DataSource
  ): Promise<ProcessingResult>
  private async updateSyncStatus(jobId: string, result: SyncResult): Promise<void>
}

interface SyncResult {
  success: boolean
  filesFound: number
  filesImported: number
  errors: string[]
  duration: number
}
```

### Environment-based Configuration
**File**: `src/lib/config/dataSourceConfig.ts` (new)
```typescript
export const dataSourceConfig = {
  // Use absolute path as specified in environment or default to project-relative
  syncFolder: process.env.DATA_SYNC_FOLDER || path.join(process.cwd(), 'data-sync'),
  maxConcurrentJobs: parseInt(process.env.DATA_SYNC_MAX_CONCURRENT || '3'),
  
  git: {
    defaultBranch: 'main',
    timeoutSeconds: 300,
    maxRetries: 3,
    requireSystemGit: true // System Git CLI required
  }
}
```

### Service Integration
**File**: `src/lib/services/index.ts` (update)
```typescript
// Export all new services
export * from './gitService'
export * from './sshKeyService' 
export * from './fileProcessingService'
export * from './syncSchedulerService'
export * from './syncOrchestrator'
```

### Application Startup
**File**: `src/lib/services/queueService.ts` (update)
```typescript
// In the existing queue service, start the sync scheduler
export class QueueService {
  private syncScheduler?: SyncSchedulerService
  
  async start(): Promise<void> {
    // Existing queue processing logic...
    
    // Start data source sync scheduler
    this.syncScheduler = new SyncSchedulerService()
    this.syncScheduler.start()
  }
  
  async stop(): Promise<void> {
    this.syncScheduler?.stop()
    // Existing cleanup...
  }
}
```

### Tasks
- [ ] Create SyncSchedulerService using DB interval settings
- [ ] Build SyncOrchestrator to coordinate sync operations
- [ ] Add configuration management for data source settings
- [ ] Integrate scheduler with existing queue service
- [ ] Add comprehensive logging and monitoring
- [ ] Implement retry logic and error recovery

---

## Phase 5: User Interface - Monitoring & Status
**Goal**: Provide visibility into sync operations and health

### Dashboard Integration
**File**: `src/routes/index.tsx` (update)
```tsx
// Add data sources section to main dashboard
// Features:
// - Recent sync activity
// - Health status overview
// - Quick links to management
```

### Sync History & Logs
**File**: `src/routes/data-sources/$id/history.tsx` (new)
```tsx
// Detailed sync history for a data source
// Features:
// - Chronological sync job list
// - Success/failure indicators
// - Files imported counts
// - Error messages and details
// - Duration and performance metrics
// - Expandable job details
```

### Real-time Status Updates
**File**: `src/components/data-sources/SyncProgressIndicator.tsx` (new)
```tsx
// Real-time sync progress component
// Features:
// - Current sync status (idle, running, error)
// - Progress indicators for active syncs
// - Last sync timestamp
// - Next scheduled sync time
// - Error state display
```

### System Health Page
**File**: `src/routes/system/health.tsx` (new)
```tsx
// Overall system health and diagnostics
// Features:
// - Data source connectivity tests
// - Sync folder accessibility
// - SSH key validation
// - Queue system status
// - Performance metrics
```

### Tasks
- [ ] Add data sources section to main dashboard
- [ ] Create detailed sync history viewer
- [ ] Build real-time status components
- [ ] Implement system health diagnostics
- [ ] Add performance monitoring
- [ ] Create alert system for failures

---

## Phase 6: Error Handling & Edge Cases
**Goal**: Robust error handling and edge case management

### Error Handling Strategies

#### Repository Access Issues
**File**: `src/lib/services/errorHandlers/gitErrorHandler.ts` (new)
```typescript
export class GitErrorHandler {
  handleCloneError(error: Error, config: GitConfig): GitErrorResult
  handlePullError(error: Error, repoPath: string): GitErrorResult
  handleAuthenticationError(error: Error): GitErrorResult
  handleNetworkError(error: Error): GitErrorResult
  
  private shouldRetry(error: Error): boolean
  private getRetryDelay(attemptCount: number): number
  private sanitizeErrorMessage(error: Error): string
}
```

#### File Processing Edge Cases
- Binary files detection and skipping
- Large file handling (size limits)
- Invalid UTF-8 content handling
- Permission issues
- Symbolic link handling
- Git submodule handling
- Frontmatter parsing errors
- Recipe update conflicts (when source file changes)

#### Network and Connectivity
- Connection timeouts
- DNS resolution failures
- SSH key authentication failures
- Rate limiting from Git providers
- Intermittent network issues

#### Concurrent Access Issues
- Multiple sync jobs for same repository
- File system locking
- Database transaction conflicts
- Queue job deduplication

### Recovery Mechanisms
**File**: `src/lib/services/recoveryService.ts` (new)
```typescript
export class RecoveryService {
  async recoverFailedSync(jobId: string): Promise<boolean>
  async cleanupCorruptedRepository(repoPath: string): Promise<void>
  async resetDataSourceState(dataSourceId: string): Promise<void>
  async validateRepositoryIntegrity(repoPath: string): Promise<boolean>
  
  private async backupRepository(repoPath: string): Promise<string>
  private async restoreRepository(backupPath: string, targetPath: string): Promise<void>
}
```

### Validation and Safety
**File**: `src/lib/services/validationService.ts` (new)
```typescript
export class ValidationService {
  async validateRepositoryUrl(url: string): Promise<ValidationResult>
  async validateSSHKey(privateKey: string): Promise<ValidationResult>
  async validateGlobPatterns(patterns: string[]): Promise<ValidationResult>
  async validateSyncFolderPermissions(path: string): Promise<ValidationResult>
  
  private async testRepositoryAccess(url: string, sshKey?: string): Promise<boolean>
  private validateGlobSyntax(pattern: string): boolean
}
```

### Tasks
- [ ] Implement comprehensive error handling for Git operations
- [ ] Add file processing edge case handling
- [ ] Create network resilience mechanisms
- [ ] Build recovery services for failed operations
- [ ] Add validation services for all inputs
- [ ] Implement cleanup and maintenance routines
- [ ] Add monitoring and alerting for edge cases
- [ ] Create diagnostic tools for troubleshooting

---

## Phase 7: Security & Performance
**Goal**: Secure and efficient data source operations

### Security Considerations

#### SSH Key Security
- Encrypted storage of private keys
- Key rotation mechanisms
- Access logging and auditing
- Secure key generation
- Proper file permissions (600 for private keys)

#### Repository Access Security
- URL validation and sanitization
- Path traversal prevention
- Sandboxed execution
- Resource limits
- Input sanitization

#### Data Protection
- Sensitive data detection and filtering
- Secure temporary file handling
- Proper cleanup of cloned repositories
- Audit logging of all operations

### Performance Optimizations

#### Efficient Sync Operations
**File**: `src/lib/services/optimizations/syncOptimizer.ts` (new)
```typescript
export class SyncOptimizer {
  async optimizeRepositoryClone(config: GitConfig): Promise<GitCloneOptions>
  async calculateIncrementalSync(repoPath: string): Promise<string[]>
  async optimizeFileDiscovery(repoPath: string, globs: string[]): Promise<string[]>
  
  private async useShallowClone(config: GitConfig): Promise<boolean>
  private async useSparseCheckout(repoPath: string, patterns: string[]): Promise<void>
  private async cacheRepositoryMetadata(repoPath: string): Promise<void>
}
```

#### Resource Management
- Connection pooling for Git operations
- File processing queue limits
- Memory usage monitoring
- Disk space management
- CPU usage throttling

#### Caching Strategies
- Repository metadata caching
- File content hashing for change detection
- Glob pattern matching caches
- SSH key validation caches

### Monitoring and Metrics
**File**: `src/lib/services/monitoring/dataSourceMetrics.ts` (new)
```typescript
export class DataSourceMetrics {
  async recordSyncDuration(dataSourceId: string, duration: number): Promise<void>
  async recordFilesProcessed(dataSourceId: string, count: number): Promise<void>
  async recordError(dataSourceId: string, error: Error): Promise<void>
  
  async getSyncPerformanceMetrics(dataSourceId: string): Promise<PerformanceMetrics>
  async getSystemResourceUsage(): Promise<ResourceUsage>
}
```

### Tasks
- [ ] Implement SSH key encryption and secure storage
- [ ] Add comprehensive input validation and sanitization
- [ ] Create sync optimization strategies
- [ ] Implement resource usage monitoring
- [ ] Add performance metrics collection
- [ ] Create security audit logging
- [ ] Implement rate limiting and throttling
- [ ] Add comprehensive testing for security scenarios

---

## Phase 8: Testing & Documentation
**Goal**: Comprehensive testing and documentation

### Testing Strategy

#### Manual Testing Focus
Primary testing approach will be manual testing during development phase.

#### Unit Tests (Future)
**Directory**: `src/__tests__/services/` (new)
- GitService unit tests
- SSHKeyService unit tests  
- FileProcessingService unit tests
- SyncOrchestrator unit tests
- All data access layer tests

#### Integration Tests (Future)
**Directory**: `src/__tests__/integration/` (new)
- End-to-end sync workflows
- Database integration tests
- Queue system integration
- UI component integration

#### E2E Tests (Future)
**Directory**: `e2e/data-sources/` (new)
- Full data source lifecycle
- UI interactions
- Error scenarios
- Performance testing

### Test Data & Fixtures
**Directory**: `src/__tests__/fixtures/data-sources/` (new)
- Sample Git repositories
- Mock SSH keys
- Test glob patterns
- Error scenarios

### Documentation

#### API Documentation
**File**: `docs/api/data-sources.md` (new)
- Data source API endpoints
- Configuration options
- Error codes and handling
- Performance considerations

#### User Guide
**File**: `docs/user-guide/data-sources.md` (new)
- Setting up Git data sources
- SSH key configuration
- Glob pattern examples
- Troubleshooting guide

#### Developer Guide
**File**: `docs/developer/data-sources.md` (new)
- Architecture overview
- Adding new data source types
- Extending sync logic
- Testing strategies

### Tasks
- [ ] Create comprehensive unit test suite
- [ ] Build integration tests for all components
- [ ] Add E2E tests for user workflows
- [ ] Create test fixtures and mock data
- [ ] Write API documentation
- [ ] Create user guides and tutorials
- [ ] Document architecture and extension points
- [ ] Add troubleshooting documentation

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Database schema and migrations
- Core data models  
- Basic validation

### Phase 2: Management UI (Week 2)
- CRUD interfaces
- Configuration forms
- SSH key input/generation UI
- Project integration settings

### Phase 3: Git Integration (Week 3)  
- Git service implementation
- SSH key utilities (DB storage)
- File processing logic

### Phase 4: Background Jobs (Week 4)
- Sync scheduler (using DB intervals)
- Queue integration
- Orchestration logic

### Phase 5: Monitoring UI (Week 5)
- Status dashboards
- History views
- Real-time updates

### Phase 6: Edge Cases (Week 6)
- Error handling
- Recovery mechanisms
- Validation

### Phase 7: Security & Performance (Week 7)
- Security hardening
- Performance optimization
- Monitoring

### Phase 8: Testing & Documentation (Week 8)
- Manual testing and bug fixes
- Documentation
- Final polish

---

## Future Extensions

### Additional Data Source Types
- **Confluence**: Wiki page integration
- **SharePoint**: Document library sync
- **Notion**: Knowledge base integration
- **Google Drive**: Document folder sync
- **Local Filesystem**: Direct folder watching

### Advanced Features
- **Smart Content Detection**: AI-powered relevance scoring
- **Conflict Resolution**: Handle duplicate content
- **Version Control Integration**: Track source changes
- **Webhook Support**: Real-time updates
- **Multi-tenant Support**: Organization-level sources

### Integration Enhancements
- **CI/CD Integration**: Sync on deployment
- **Slack Notifications**: Sync status updates
- **Email Alerts**: Error notifications
- **API Webhooks**: External system integration
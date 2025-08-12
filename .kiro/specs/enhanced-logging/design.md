# Design Document

## Overview

The Enhanced Logging System provides comprehensive application logging capabilities for Neural Kitchen, including structured file-based logging and a web-based log viewer interface. The system captures application events, user actions, database changes, API requests, and security events to support debugging, auditing, and system monitoring.

The logging system is designed to integrate seamlessly with the existing TanStack Start architecture, Prisma ORM, and Express-based MCP server while providing minimal performance impact and robust error handling.

## Architecture

### Base Library

The logging system will be built on **Pino** (`pino` npm package) as the core logging library, chosen for:
- Extremely fast performance with minimal overhead (faster than Winston)
- Built-in structured JSON logging optimized for production
- Low memory footprint and CPU usage
- Excellent ecosystem with specialized transports
- Built-in support for child loggers with context
- Modern async/await friendly API

Additional Pino-related packages:
- `pino-roll` for automatic log file rotation
- `pino-pretty` for human-readable development logging
- `pino-http` for HTTP request logging middleware

### Core Components

1. **Logger Service** (`src/lib/services/logger.ts`)
   - Pino-based centralized logging interface with configurable levels and categories
   - File rotation and retention management via pino-roll
   - Structured JSON logging format using Pino's native JSON output
   - High-performance async operations with Pino's optimized serialization

2. **Log Storage** (`logs/` directory)
   - Rotating log files with configurable size limits
   - Separate files for different log categories (app.log, audit.log, error.log)
   - Compressed archives for historical logs
   - Configurable retention policies

3. **Web UI Components**
   - Log viewer page with real-time updates by reading log files
   - Filtering and search capabilities across log file contents
   - Pagination for large log files
   - Export functionality for log analysis

4. **Middleware Integration**
   - Express middleware for API request logging
   - Error boundary integration for client-side error logging

### System Integration Points

- **TanStack Start Server**: Integrated at server startup and request handling
- **MCP Server**: Separate logging instance for MCP-specific events
- **Prisma ORM**: Middleware hooks for database operation logging
- **Queue Processor**: Enhanced logging for background job processing
- **Authentication System**: Audit logging for security events (post-auth implementation)

## Components and Interfaces

### Logger Service Interface

The Logger Service wraps Pino with application-specific functionality:

```typescript
interface LoggerService {
  // Core logging methods (Pino-compatible)
  error(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  debug(message: string, meta?: LogMeta): void
  trace(message: string, meta?: LogMeta): void
  
  // Specialized logging methods
  audit(event: AuditEvent): void
  security(event: SecurityEvent): void
  database(operation: DatabaseOperation): void
  api(request: APIRequest, response: APIResponse): void
  
  // Child logger creation for context
  child(bindings: Record<string, any>): LoggerService
  
  // Configuration and management
  setLevel(level: LogLevel): void
  setCategories(categories: LogCategory[]): void
  rotate(): Promise<void>  // Triggers pino-roll rotation
  cleanup(): Promise<void>
  
  // Pino instance access for advanced usage
  getPinoLogger(): pino.Logger
}

interface LogMeta {
  userId?: string
  sessionId?: string
  requestId?: string
  category: LogCategory
  tags?: string[]
  data?: Record<string, any>
}

interface AuditEvent {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  changes?: Record<string, { old: any, new: any }>
  metadata?: Record<string, any>
}
```

### Log File Reading Service

```typescript
interface LogFileReader {
  readRecent(limit: number, filters?: LogFilters): Promise<LogEntry[]>
  search(query: string, filters?: LogFilters): Promise<LogEntry[]>
  tail(callback: (entry: LogEntry) => void): void
  getLogFiles(): Promise<string[]>
  readRange(startTime: Date, endTime: Date): Promise<LogEntry[]>
}

enum LogLevel {
  ERROR
  WARN
  INFO
  DEBUG
  TRACE
}

enum LogCategory {
  AUTH
  API
  UI
  SYSTEM
  SECURITY
  QUEUE
  MCP
}
```

### Web UI Components

```typescript
// Log viewer page component
interface LogViewerProps {
  initialLogs?: LogEntry[]
  filters?: LogFilters
  realTimeUpdates?: boolean
}

interface LogFilters {
  level?: LogLevel[]
  category?: LogCategory[]
  dateRange?: { start: Date, end: Date }
  userId?: string
  searchQuery?: string
}

// Real-time log updates using file watching and Server-Sent Events
interface LogStreamService {
  subscribe(filters: LogFilters): EventSource
  unsubscribe(): void
  watchLogFiles(): void
  stopWatching(): void
}
```

## Data Models

### Log Entry Structure

```typescript
interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: LogCategory
  message: string
  meta?: {
    userId?: string
    sessionId?: string
    requestId?: string
    tags?: string[]
    data?: Record<string, any>
  }
}
```

### File Log Format

```json
{
  "timestamp": "2025-01-11T10:30:00.000Z",
  "level": "INFO",
  "category": "API",
  "message": "Recipe created successfully",
  "meta": {
    "userId": "user_123",
    "requestId": "req_456",
    "recipeId": "recipe_789",
    "action": "create_recipe",
    "data": {
      "title": "New Recipe",
      "shortId": "new-recipe"
    }
  }
}
```

### Configuration Schema

```typescript
interface LoggingConfig {
  level: LogLevel
  categories: LogCategory[]
  file: {
    enabled: boolean
    directory: string
    maxSize: string // e.g., "10MB"
    maxFiles: number
    compress: boolean
  }
  ui: {
    enabled: boolean
    maxDisplayEntries: number
    refreshInterval: number
  }
  realTime: {
    enabled: boolean
    maxConnections: number
  }
}
```

## Error Handling

### File System Errors
- Graceful degradation when log directory is not writable
- Fallback to console logging when file operations fail
- Automatic retry with exponential backoff for transient failures
- Health check endpoint to monitor logging system status

### File Reading Errors
- Graceful handling when log files are locked or unavailable
- Fallback to cached log entries when file reading fails
- Automatic retry with exponential backoff for file access issues
- Error reporting when log files are corrupted or unreadable

### Memory Management
- Configurable in-memory buffer for log entries
- Automatic flushing to prevent memory leaks
- Backpressure handling for high-volume logging scenarios
- Memory usage monitoring and alerts

## Testing Strategy

### Unit Tests
- Logger service functionality with mocked file system
- Log rotation and retention logic
- Configuration validation and error handling
- Database model operations and queries

### Integration Tests
- End-to-end logging flow from application to file/database
- Web UI log viewer with real data
- Real-time updates and filtering functionality
- Performance testing with high log volumes

### Performance Tests
- Log writing performance under load
- Database query performance with large log datasets
- Memory usage patterns during extended operation
- File I/O performance with concurrent access

### Security Tests
- Log injection prevention
- Sensitive data filtering and masking
- Access control for log viewer interface
- Audit trail integrity and tamper detection

## Implementation Phases

### Phase 1: Core Logging Infrastructure
- Install Pino, pino-roll, pino-pretty, and pino-http dependencies
- Logger service implementation wrapping Pino
- File-based logging with rotation using pino-roll
- Basic configuration system with Pino destinations
- Integration with existing services (server.ts, mcp-server.ts)

### Phase 2: File Reading Service
- Log file reading and parsing implementation
- File watching for real-time updates
- Search and filtering across log files
- Performance optimization for large files

### Phase 3: Web UI Development
- Log viewer page and components
- Filtering and search functionality
- Pagination and performance optimization
- Real-time updates implementation

### Phase 4: Advanced Features
- Audit logging for all data changes
- Security event logging
- Log export and analysis tools
- Monitoring and alerting integration

## Security Considerations

### Data Protection
- Automatic filtering of sensitive information (passwords, tokens, PII)
- Configurable field masking for log entries
- Secure log file permissions and access controls
- Encryption for archived log files

### Access Control
- Role-based access to log viewer interface
- API endpoint protection for log data
- Audit logging of log access events
- Session-based access tracking

### Compliance
- Configurable data retention policies
- GDPR-compliant data handling
- Audit trail requirements
- Log integrity verification

## Performance Considerations

### File I/O Optimization
- Pino's built-in asynchronous file writing with minimal overhead
- Configurable buffer sizes via Pino destinations
- SSD-optimized file rotation strategies with pino-roll
- Compression for archived logs via pino-roll configuration

### File Reading Performance
- Efficient file parsing and streaming for large log files
- Indexed searching across multiple log files
- Caching of recent log entries for faster UI updates
- Optimized file watching with minimal resource usage

### Memory Usage
- Streaming log processing to minimize memory footprint
- Configurable cache sizes for recent logs
- Garbage collection optimization
- Memory leak prevention and monitoring

## Monitoring and Observability

### Health Checks
- Log system health endpoint
- File system availability monitoring
- Log file accessibility checks
- Performance metrics collection

### Metrics
- Log volume and rate tracking
- Error rate monitoring
- Performance metrics (latency, throughput)
- Resource usage monitoring (disk, memory, CPU)

### Alerting
- Critical error notifications
- Disk space warnings
- Performance degradation alerts
- Security event notifications
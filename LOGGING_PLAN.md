# LOGGING_PLAN.md

## Overview
Add comprehensive structured logging to Neural Kitchen using Pino with file-based logging and pretty console output for development.

## Goals
- Structured JSON logging for production with log rotation
- Pretty console output for development 
- Separate log files for different components (web, MCP, background tasks)
- Configurable log levels via environment variables
- Performance monitoring and error tracking

## Technical Implementation

### 1. Dependencies
Add Pino and related packages:
```bash
pnpm add pino pino-pretty pino-abstract-transport
```

### 2. Environment Configuration
Add to `.env.example` and `.env`:
```env
# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
LOG_PRETTY_CONSOLE=true
```

### 3. Log File Organization
```
logs/
├── app.log              # Main application logs
├── mcp.log              # MCP server specific logs  
├── background-tasks.log # Background queue processor logs
├── auth.log             # Authentication related logs
├── database.log         # Database operation logs
├── error.log            # Error-only logs (all components)
└── combined.log         # All logs combined
```

### 4. Logger Configuration (`src/lib/logger.ts`)
Create a centralized logger factory that:
- Configures Pino with appropriate transports
- Handles development vs production formatting
- Sets up file rotation (daily rotation, keep 30 days)
- Creates component-specific child loggers
- Adds request correlation IDs

### 5. Integration Points

#### Web Application
- Request/response logging middleware for TanStack Start
- User action logging (login, recipe creation, etc.)
- Performance timing for server functions
- Error boundary logging

#### MCP Server (`src/mcp-server.ts`)
- Tool execution logging
- Request/response logging with correlation IDs
- Performance metrics for recipe searches
- Connection state logging

#### Background Tasks (`src/background-tasks.ts`)
- Queue processing logs
- AI operation logging (summarization, embeddings)
- Job completion/failure tracking
- Retry attempt logging

#### Database Operations
- Prisma query logging (configurable)
- Connection pool monitoring
- Migration execution logs
- Performance slow query alerts

### 6. Log Levels Strategy
- **error**: Application errors, exceptions, failed operations
- **warn**: Deprecated features, potential issues, retries
- **info**: User actions, system events, job completions
- **debug**: Detailed operation flow, request/response data
- **trace**: Very verbose debugging (disabled in production)

### 7. Structured Fields
Consistent field naming across all logs:
```typescript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "info",
  component: "mcp|web|tasks|auth|db",
  requestId: "req_123",
  userId?: "user_456", 
  action: "recipe_created",
  duration?: 150,
  error?: { message, stack, code },
  metadata: { /* context specific data */ }
}
```

### 8. Development Experience
- Pretty console output with colors and formatting
- Request correlation across components
- Easy log filtering by component or user
- Performance timing visibility
- Clear error formatting with stack traces

### 9. Production Considerations
- JSON structured logs for log aggregation tools
- Log rotation to prevent disk space issues
- Configurable log retention policies
- Security: sanitize sensitive data (passwords, API keys)
- Performance: async logging, minimal overhead

### 10. UI Log Viewing & Tailing
Real-time log viewing interface for development and admin use:

#### Server-Side Log Reading (`src/lib/services/logReader.ts`)
- File watching with `chokidar` for real-time updates
- Streaming log entries via Server-Sent Events (SSE)
- Log parsing for structured display
- Filtering by component, level, time range, user
- Pagination for large log files

#### API Endpoints
```typescript
// Get log files list
GET /api/logs/files

// Stream log tail (SSE)  
GET /api/logs/stream?file=app.log&lines=100&follow=true

// Get log entries with filtering
GET /api/logs/entries?file=app.log&level=error&component=mcp&limit=50
```

#### UI Components (`src/routes/admin/logs/`)
- Log viewer page with real-time updates
- Component/level filtering dropdowns
- Search functionality across log content
- Auto-scroll toggle for tail behavior  
- Download logs functionality
- Dark/light theme for log content

#### Technical Implementation
```typescript
// Dependencies
pnpm add chokidar         # File watching
pnpm add @types/eventsource  # SSE types

// Server-Sent Events for real-time log streaming
const logStream = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async ({ request }) => {
    // Admin-only access
    if (context.user?.role !== "admin") throw new Error("Unauthorized");
    
    // Stream log updates via SSE
    return new EventSource("/api/logs/stream");
  });
```

### 11. Monitoring Integration Ready
Structure logs for future integration with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- DataDog
- Application Performance Monitoring (APM) tools

## Implementation Phases

### Phase 1: Core Logging Infrastructure 🏗️ ✅ **COMPLETED**
**Goal**: Basic Pino logging with file output

**Dependencies**:
- [x] `pnpm add pino pino-pretty pino-abstract-transport`

**Environment Setup**:
- [x] Add logging environment variables to `.env.example`
- [x] Update local `.env` file with logging config
- [x] Create `logs/` directory structure

**Core Logger**:
- [x] Create `src/lib/logger.ts` with Pino configuration
- [x] Set up file transports for different log files
- [x] Configure development vs production formatting
- [x] Add log rotation configuration (basic implementation)
- [x] Create typed logger interface with component namespacing
- [x] Add comprehensive documentation and usage examples

**Testing**:
- [x] Test file logging works with different levels
- [x] Verify component-specific log files are created
- [x] Confirm pretty console output in development

**✅ Phase 1 Results:**
- Logger creates 6 log files: `combined.log`, `app.log`, `mcp.log`, `background-tasks.log`, `auth.log`, `database.log`
- Pretty console output with colorized component labels like `[WEB]`, `[MCP]`, `[TASKS]`
- Structured JSON logging to files with timestamps and metadata
- Component-specific loggers: `logger.web`, `logger.mcp`, `logger.tasks`, `logger.auth`, `logger.db`
- Performance timing utilities with request correlation IDs
- Full documentation with usage examples

### Phase 2: Service Integration 🔌
**Goal**: Integrate logging across existing services

**MCP Server Integration**:
- [ ] Add logger import to `src/mcp-server.ts`
- [ ] Log MCP tool executions with timing
- [ ] Log connection events and errors
- [ ] Add request correlation IDs

**Background Tasks Integration**:
- [ ] Add logger to `src/background-tasks.ts`
- [ ] Log queue processing events
- [ ] Log AI operations (summarization, embeddings)
- [ ] Log job retries and failures

**Web Application Integration**:
- [ ] Create request logging middleware for TanStack Start
- [ ] Log user authentication events
- [ ] Log server function executions with timing
- [ ] Add error boundary logging

**Database Logging**:
- [ ] Configure Prisma query logging
- [ ] Log slow queries and connection issues
- [ ] Add migration execution logging

**Testing**:
- [ ] Verify logs appear in correct files
- [ ] Test log correlation across components
- [ ] Confirm performance impact is minimal

### Phase 3: Log Reading Infrastructure 📖
**Goal**: Server-side log reading and streaming

**Dependencies**:
- [ ] `pnpm add chokidar @types/eventsource`

**Log Reader Service**:
- [ ] Create `src/lib/services/logReader.ts`
- [ ] Implement file watching with chokidar
- [ ] Add log parsing for structured entries
- [ ] Create filtering logic (component, level, time)
- [ ] Add pagination support for large files

**API Endpoints**:
- [ ] Create `src/routes/api/logs/files.ts` - list available log files
- [ ] Create `src/routes/api/logs/entries.ts` - get filtered log entries
- [ ] Create `src/routes/api/logs/stream.ts` - SSE streaming endpoint
- [ ] Add admin-only middleware protection

**Testing**:
- [ ] Test file watching detects new log entries
- [ ] Verify filtering works correctly
- [ ] Test SSE streaming with multiple clients
- [ ] Confirm admin authorization works

### Phase 4: UI Log Viewer 🖥️
**Goal**: Web-based log viewing interface

**Admin Route Structure**:
- [ ] Create `src/routes/admin/logs/` directory
- [ ] Create `src/routes/admin/logs/index.tsx` - main log viewer
- [ ] Add navigation link in admin panel

**Log Viewer Components**:
- [ ] Create `LogViewer` component with real-time updates
- [ ] Build filtering UI (component, level, search)
- [ ] Add auto-scroll toggle for tail behavior
- [ ] Implement log entry formatting and syntax highlighting
- [ ] Add download logs functionality

**Real-time Updates**:
- [ ] Implement SSE client connection
- [ ] Handle connection errors and reconnection
- [ ] Add loading states and error handling
- [ ] Optimize rendering for high-frequency updates

**UI/UX Polish**:
- [ ] Style log entries with proper colors/formatting
- [ ] Add dark/light theme support
- [ ] Implement responsive design
- [ ] Add keyboard shortcuts (clear, pause, search)

**Testing**:
- [ ] Test real-time log updates in browser
- [ ] Verify filtering UI works correctly
- [ ] Test with multiple log files
- [ ] Confirm admin-only access

### Phase 5: Advanced Features ⚡
**Goal**: Enhanced logging capabilities and monitoring

**Log Analytics**:
- [ ] Add log entry statistics (errors/hour, etc.)
- [ ] Create log pattern detection
- [ ] Add performance metrics dashboard
- [ ] Implement alert thresholds

**Export & Integration**:
- [ ] Add CSV/JSON export functionality
- [ ] Create log archive management
- [ ] Add external tool integration hooks
- [ ] Implement log shipping capabilities

**Performance Optimization**:
- [ ] Optimize log file reading for large files
- [ ] Add log compression for archives
- [ ] Implement smart log retention policies
- [ ] Add memory usage monitoring

**Security & Compliance**:
- [ ] Add sensitive data sanitization
- [ ] Implement audit trail logging
- [ ] Add user action correlation
- [ ] Create compliance reporting features

**Testing**:
- [ ] Load test with high log volume
- [ ] Test export functionality
- [ ] Verify security measures work
- [ ] Performance benchmarking

## Getting Started
To begin implementation, start with **Phase 1** and complete all checklist items before moving to the next phase. Each phase builds on the previous one and can be tested independently.

## Future Enhancements
- Log aggregation dashboard
- Alerting on error rates
- Performance monitoring dashboards  
- User activity analytics
- Audit trail for admin actions
- **Log export functionality (CSV, JSON)**
- **Log analytics and pattern detection**
- **Integration with external log management tools**
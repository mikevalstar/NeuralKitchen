# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neural Kitchen is a recipe/cookbook management system for AI agents, designed to provide structured guidance and examples for AI development workflows. The application allows developers to create, version, and organize "recipes" - step-by-step instructions and code examples that AI agents can follow when working through problems in software projects.

The core problem this solves: AI agents often lack context about project conventions, best practices, and existing patterns. Without comments or clear examples, they struggle to understand why certain approaches are used. Neural Kitchen builds a library of recipes that capture institutional knowledge and provide contextual guidance through an MCP (Model Context Protocol) interface.

This project is in early development with plans to expand into a comprehensive AI agent guidance system.

## Dev Notes

The developer is always running the project with `pnpm dev` so you don't have to compile or restart the services.

If you feel like we are making a mistake in design or how something is being implemented, stop and ask the user to confirm. Be cautious.

## Current Plan
The file `PROJECT_PLAN.md` hs the current project plan, and is useful to reference. 

## Development Commands

### Core Development
- `pnpm dev` - Start development server on port 3000 AND MCP server on port 3002 (uses concurrently)
- `pnpm dev:web` - Start only the web development server on port 3000
- `pnpm build` - Build the application and run TypeScript checks
- `pnpm start` - Start production server

### MCP Server
- `pnpm mcp:dev` - Start MCP server in watch mode on port 3002 (development)
- `pnpm mcp:start` - Start MCP server on port 3002 (production)

### Code Quality
- `pnpm lint` - Run Biome linter
- `pnpm lint:fix` - Run Biome linter with auto-fix
- `pnpm format` - Check code formatting with Biome
- `pnpm format:fix` - Format code with Biome
- `pnpm check` - Run all Biome checks (lint + format)
- `pnpm check:fix` - Run all Biome checks with auto-fix

### Database Operations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from database
- `pnpm db:migrate` - Create and apply new migration
- `pnpm db:migrate:deploy` - Deploy migrations in production
- `pnpm db:migrate:reset` - Reset database and run all migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed the database with initial data
= `pnpx prisma db pull` - Pull the latest db from the server

When modifying the database, please use `pnpx prisma migrate dev --name {name_here}` to generate a new migration, so we keep the migrations in sync with the server.

## Architecture

### Tech Stack
- **Frontend**: React 19 with TanStack Start (full-stack React framework)
- **Router**: TanStack Router with file-based routing
- **Database**: PostgreSQL with Prisma ORM and Accelerate extension with vector search support
- **Styling**: TailwindCSS v4 with Shadcn/ui components
- **Forms**: TanStack Form with Zod validation
- **Code Quality**: Biome for linting and formatting
- **UI Components**: Radix UI primitives with custom styling
- **MCP Server**: Model Context Protocol server for AI agent integration
- **AI Services**: OpenAI API for content summarization and vector embeddings
- **Background Processing**: Queue system for AI operations with error handling

### Database Schema
The application uses a recipe versioning system for AI agent guidance with the following key models:
- **Recipe**: Main recipe entity with `shortId` and reference to current version (represents a development pattern/workflow)
- **RecipeVersion**: Versioned content with `title`, `content`, `versionId`, `summary`, and `isCurrent` flag (stores the actual instructions/examples)
- **Tag**: Tagging system with soft delete support (`deletedAt`) for categorizing recipes (e.g., "frontend", "database", "testing")
- **Project**: Project organization system for grouping related recipes by codebase or domain
- **Queue**: Background job processing system with `type`, `data`, `status`, `error`, and retry fields
- **RecipeVersionVectorSearch**: Vector embeddings table for semantic search with `embedding` vector field
- Many-to-many relationships between RecipeVersion ↔ Tags and RecipeVersion ↔ Projects

### File Structure
- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - React components including ui/ for Shadcn components
- `src/lib/` - Utilities, Prisma client, and data access layers
- `src/lib/data/` - Namespaced data access functions (e.g., `Tags.list()`, `Tags.create()`)
- `src/lib/services/` - Background services (queue processor, AI integrations)
- `src/lib/dataValidators.ts` - Zod schemas for input validation
- `src/mcp-server.ts` - MCP (Model Context Protocol) server implementation
- `src/generated/prisma/` - Generated Prisma client (custom output location)
- `prisma/` - Database schema and migrations

### Key Patterns

#### Data Access Layer
Data operations are organized in namespaces under `src/lib/data/`. Example pattern:
```typescript
export namespace Tags {
  export async function list() { /* implementation */ }
  export async function create(data: TagInput) { /* implementation */ }
  export async function update(id: string, data: TagInput) { /* implementation */ }
}
```

#### Server Functions
Uses TanStack Start's `createServerFn` for server-side data fetching:
```typescript
const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.tag.findMany({});
});
```

#### Soft Delete Pattern
Models like Tag implement soft delete with `deletedAt` timestamp. Always filter `deletedAt: null` in queries.

#### Background Processing Pattern
Queue system processes AI operations asynchronously:
- Recipe content is queued for summarization and embedding generation
- Queue processor runs every 5 seconds using setTimeout loop
- Error handling with retry logic and status tracking

#### Vector Search Pattern
Semantic search using PostgreSQL vector extension:
- Content is embedded using OpenAI's text-embedding-3-small model
- Hybrid search combines vector similarity with text fallback
- Embeddings are versioned alongside recipe content

#### MCP Integration Pattern
Model Context Protocol server provides AI agents with recipe access:
- Standalone server runs on port 3002 alongside main app
- Uses @modelcontextprotocol/sdk for standard compliance
- Provides tools for recipe discovery and content retrieval

#### Theme System
Built-in dark/light mode with `next-themes` and theme script in root route for flash prevention.

## Development Notes

**IMPORTANT**: The user is always running the development server with `pnpm dev:web` on port 3000. DO NOT attempt to start or restart the server - it's already running and the user is monitoring changes in real-time.

### Biome Configuration
- 2-space indentation
- 120 character line width
- Double quotes for JavaScript
- Ignores generated files (`routeTree.gen.ts`, `generated/**`)
- Auto-organize imports enabled

### Database Client
Prisma client is extended with Accelerate and outputs to custom location. Import from:
```typescript
import prisma from "~/lib/prisma";
```

### Component Development
Follow existing Shadcn/ui patterns. Check `components.json` for configuration. Components use Tailwind with CSS variables for theming.

### Form Handling
Use TanStack Form with Zod adapters. Validation schemas are defined in `src/lib/dataValidators.ts`.

### Date Formatting Standards
Always use the standardized date formatting utilities from `src/lib/dateUtils.ts`:
- `formatDateOnly(date)` for date-only display using dayjs 'll' format (e.g., "Oct 13, 2014")
- `formatDateTime(date)` for date with time using dayjs 'lll' format (e.g., "Oct 13, 2014 1:30 PM")
- Never use native JavaScript date formatting methods like `toLocaleDateString()`

### MCP Server Development
The MCP server (`src/mcp-server.ts`) provides AI agents with recipe access:
- Uses Express.js with streamable HTTP transport for stateless operation
- Health check endpoint available at `/health`
- MCP requests handled at POST `/mcp`
- Currently implements basic "hello_world" tool (placeholder for recipe tools)
- Graceful shutdown handling with SIGINT/SIGTERM
- Development: runs in watch mode alongside main app via `pnpm dev`

### Authentication System
The application uses Better Auth for authentication with role-based access control:

#### Authentication Stack
- **Library**: Better Auth with Prisma adapter for PostgreSQL
- **Session Management**: 7-day session expiration with 1-day update interval
- **Admin Plugin**: Enabled for user management capabilities
- **Email/Password**: Enabled with web-based registration (8 character minimum password)

#### User Model
Users have a flexible role system stored as a string field:
- **Standard User**: Empty string or no role (default)
- **Admin**: "admin" role with elevated permissions
- **Ban System**: Optional `banned`, `banReason`, and `banExpires` fields for user moderation

#### Middleware Pattern
Two middleware functions provide authentication context:

**`authMiddleware`** - Soft authentication (optional user context):
```typescript
import { authMiddleware } from "~/lib/auth-middleware";

const serverFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user may be undefined if not authenticated
    return context.user;
  });
```

**`authMiddlewareEnsure`** - Hard authentication (required user context):
```typescript
import { authMiddlewareEnsure } from "~/lib/auth-middleware";

const serverFn = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async ({ context }) => {
    // context.user is guaranteed to exist or middleware throws error
    return context.user;
  });
```

#### Role-Based Access Control
Admin-only operations check the user's role explicitly:
```typescript
// Example from user edit functionality
const editUser = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .handler(async (ctx) => {
    if (ctx.context.user?.role !== "admin") {
      throw new Error("User not authorized");
    }
    // Admin-only logic here
  });
```

#### Client-Side Authentication
Better Auth provides React hooks and methods for client-side authentication:

**Session Management**:
```typescript
import { useSession, getSession } from "~/lib/auth-client";

// React hook for session state with loading state
const { data: session, isPending } = useSession();

// Server-side session retrieval
const { data: session } = await getSession({ 
  fetchOptions: { headers: getHeaders() as HeadersInit } 
});

// Session data structure
// session.user = { id, email, name, role }
```

**Authentication Actions**:
```typescript
import { signIn, signOut, changePassword } from "~/lib/auth-client";

// Email/password sign in
const result = await signIn.email({
  email: "user@example.com",
  password: "password123"
});

if (result.error) {
  // Handle authentication error
  console.error("Login failed:", result.error);
}

// Sign out user
await signOut();

// Change password for authenticated user
await changePassword({
  currentPassword: "oldPassword",
  newPassword: "newPassword"
});
```

**Admin Operations** (requires admin role):
```typescript
import { admin } from "~/lib/auth-client";

// Create user as admin
await admin.createUser({
  email: "newuser@example.com",
  password: "password123",
  name: "New User"
});

// Update user role
await admin.updateUser({
  userId: "user-id",
  role: "admin"
});
```

**Common Usage Patterns**:
```typescript
// Component with authentication state
function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <LoadingSpinner />;
  if (!session) return <LoginPrompt />;
  
  const isAdmin = session.user?.role === "admin";
  
  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}

// Redirect handling after login
const result = await signIn.email({ email, password });
if (!result.error) {
  router.navigate({ to: redirectUrl || "/" });
}
```

#### Current Usage Pattern
- Most routes use `authMiddlewareEnsure` requiring authenticated users
- User management features (edit, list users) require admin role
- CLI user creation script automatically assigns admin role
- Role validation defined in Zod schema: `z.enum(["", "admin"]).optional()`

### AI Integration Services
Background processing handles AI operations:
- Queue system manages summarization and embedding jobs
- OpenAI integration for content summarization using gpt-4o-mini
- Vector embeddings using text-embedding-3-small (6000 token limit)
- Automatic processing when recipes are created/updated
- Error handling and retry logic for failed operations
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neural Kitchen is a recipe/cookbook management system for AI agents, designed to provide structured guidance and examples for AI development workflows. The application allows developers to create, version, and organize "recipes" - step-by-step instructions and code examples that AI agents can follow when working through problems in software projects.

The core problem this solves: AI agents often lack context about project conventions, best practices, and existing patterns. Without comments or clear examples, they struggle to understand why certain approaches are used. Neural Kitchen builds a library of recipes that capture institutional knowledge and provide contextual guidance through an MCP (Model Context Protocol) interface.

This project is in early development with plans to expand into a comprehensive AI agent guidance system.

## Current Plan
The file `PROJECT_PLAN.md` hs the current project plan, and is useful to reference. 

## Development Commands

### Core Development
- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build the application and run TypeScript checks
- `pnpm start` - Start production server

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

When modifying the database, please use `pnpx prisma migrate dev --name {name_here}` to generate a new migration, so we keep the migrations in sync with the server.

## Architecture

### Tech Stack
- **Frontend**: React 19 with TanStack Start (full-stack React framework)
- **Router**: TanStack Router with file-based routing
- **Database**: PostgreSQL with Prisma ORM and Accelerate extension
- **Styling**: TailwindCSS v4 with Shadcn/ui components
- **Forms**: TanStack Form with Zod validation
- **Code Quality**: Biome for linting and formatting
- **UI Components**: Radix UI primitives with custom styling

### Database Schema
The application uses a recipe versioning system for AI agent guidance with the following key models:
- **Recipe**: Main recipe entity with `shortId` and reference to current version (represents a development pattern/workflow)
- **RecipeVersion**: Versioned content with `title`, `content`, `versionId`, and `isCurrent` flag (stores the actual instructions/examples)
- **Tag**: Tagging system with soft delete support (`deletedAt`) for categorizing recipes (e.g., "frontend", "database", "testing")
- **Project**: Project organization system for grouping related recipes by codebase or domain
- Many-to-many relationships between RecipeVersion ↔ Tags and RecipeVersion ↔ Projects

### File Structure
- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - React components including ui/ for Shadcn components
- `src/lib/` - Utilities, Prisma client, and data access layers
- `src/lib/data/` - Namespaced data access functions (e.g., `Tags.list()`, `Tags.create()`)
- `src/lib/dataValidators.ts` - Zod schemas for input validation
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

#### Theme System
Built-in dark/light mode with `next-themes` and theme script in root route for flash prevention.

## Development Notes

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
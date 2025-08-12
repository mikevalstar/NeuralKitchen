# Neural Kitchen Tech Stack

## Core Technologies

- **Frontend**: React 19 with TanStack Start (full-stack React framework)
- **Backend**: Node.js with Express (MCP server)
- **Database**: PostgreSQL with Prisma ORM and pgvector extension
- **Styling**: TailwindCSS v4 with Shadcn/ui components
- **State Management**: Jotai for client-side state
- **Code Quality**: Biome for linting, formatting, and import organization
- **Build System**: Vite with TypeScript
- **Package Manager**: pnpm

## Key Libraries

- **UI Components**: Radix UI primitives with custom Shadcn/ui implementations
- **Forms**: TanStack React Form with Zod validation
- **Routing**: TanStack React Router with file-based routing
- **Markdown**: MDXEditor for rich text editing, react-markdown for rendering
- **Search**: OpenAI embeddings with vector similarity search
- **MCP Integration**: @modelcontextprotocol/sdk for AI agent communication
- **3D Graphics**: Three.js for background effects
- **Date Handling**: dayjs for date manipulation
- **Diff Visualization**: diff library for version comparisons

## Development Commands

```bash
# Development
pnpm dev              # Start both web UI and MCP server
pnpm dev:web          # Start only web UI (port 3000)
pnpm mcp:dev          # Start only MCP server (port 3002)

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database with sample data

# Code Quality
pnpm check            # Run Biome checks (lint + format)
pnpm check:fix        # Fix Biome issues automatically
pnpm lint             # Lint only
pnpm format           # Format only

# Build & Deploy
pnpm build            # Build for production
pnpm start            # Start production server
```

## Configuration Files

- **TypeScript**: Strict mode enabled, path aliases (`~/` and `@/` → `./src/`)
- **Biome**: 2-space indentation, 120 character line width, double quotes
- **Vite**: Proxy setup for MCP server, TailwindCSS and TanStack plugins
- **Prisma**: Client generated to `src/generated/prisma/`

## Architecture Notes

- MCP server runs independently on port 3002
- Web UI proxies `/mcp` and `/health` requests to MCP server
- Database uses UUID primary keys and soft deletes (deletedAt)
- Vector embeddings stored in PostgreSQL with pgvector extension
- Generated Prisma client with Accelerate extension for performance
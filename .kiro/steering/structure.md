# Neural Kitchen Project Structure

## Root Directory

```
├── .kiro/                    # Kiro IDE configuration and steering rules
├── prisma/                   # Database schema, migrations, and seeds
├── public/                   # Static assets and help documentation
├── src/                      # Application source code
├── docker-compose.yml        # Docker development setup
├── package.json              # Dependencies and scripts
└── vite.config.ts           # Build configuration
```

## Source Code Organization (`src/`)

```
src/
├── components/               # React components
│   ├── ui/                  # Shadcn/ui base components
│   └── *.tsx                # Application-specific components
├── generated/               # Auto-generated code (Prisma client)
├── lib/                     # Shared utilities and services
│   ├── atoms/               # Jotai state atoms
│   ├── data/                # Data access layer (repository pattern)
│   └── services/            # Business logic services
├── routes/                  # TanStack Router file-based routes
├── styles/                  # Global CSS and styling
├── client.tsx               # Client-side entry point
├── mcp-server.ts           # Standalone MCP server
├── router.tsx              # Router configuration
└── server.ts               # Server-side entry point
```

## Key Patterns

### Component Organization
- **UI Components**: Base components in `components/ui/` following Shadcn/ui patterns
- **Feature Components**: Application-specific components in `components/`
- **Layout Components**: `Layout.tsx`, `Navigation.tsx` for app structure

### Data Layer
- **Repository Pattern**: Data access abstracted in `lib/data/` modules
- **Service Layer**: Business logic in `lib/services/`
- **Generated Code**: Prisma client in `src/generated/prisma/`

### Routing Structure
- **File-based Routing**: Routes defined in `src/routes/` directory
- **Nested Routes**: Organized by feature (recipes, projects, help, etc.)
- **Route Groups**: Related routes grouped in subdirectories

### Database Schema
- **Soft Deletes**: All models include `deletedAt` field
- **UUID Primary Keys**: All models use UUID for primary keys
- **Versioning**: Recipe versioning with current version tracking
- **Vector Search**: Embeddings stored in `VecDocument` model

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase with descriptive names
- **Database**: PascalCase for models, camelCase for fields
- **Routes**: kebab-case for URL segments, PascalCase for files
- **Constants**: UPPER_SNAKE_CASE for environment variables

## Import Patterns

- **Path Aliases**: Use `~/` or `@/` for src imports
- **Relative Imports**: For same-directory or nearby files
- **Barrel Exports**: Index files for clean imports from directories
- **Type Imports**: Use `import type` for TypeScript types

## Configuration Files

- **Environment**: `.env` for local config, `.env.example` for template
- **TypeScript**: `tsconfig.json` with strict mode and path mapping
- **Database**: `prisma/schema.prisma` for data model
- **Styling**: `tailwind.config.mjs` for design system
- **Code Quality**: `biome.json` for linting and formatting rules
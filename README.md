# Neural Kitchen 🧠👨‍🍳

> A recipe/cookbook management system for AI agents

Neural Kitchen helps developers create and organize structured guidance for AI agents working on software projects. Think of it as a knowledge base that captures institutional knowledge, coding patterns, and step-by-step workflows that AI agents can follow.

## The Problem

AI agents often struggle with:
- **Lack of context**: They don't understand project-specific conventions or patterns
- **Missing institutional knowledge**: Why certain approaches are used over others
- **Inconsistent implementations**: Without examples, they reinvent solutions differently each time
- **Limited guidance**: Hard to know which files contain good examples to follow

## The Solution

Neural Kitchen provides:
- **Versioned Recipes**: Step-by-step instructions and code examples for common development tasks
- **Contextual Tagging**: Organize recipes by technology, domain, or complexity
- **Project Association**: Group recipes by codebase or project type
- **MCP Integration**: (Planned) Model Context Protocol interface for AI agents to access recipes

## Use Cases

- **Onboarding new AI agents** to existing projects with established patterns
- **Standardizing implementations** across different parts of a codebase
- **Capturing tribal knowledge** before team members leave
- **Creating reusable workflows** for common development tasks
- **Providing context** for why certain architectural decisions were made

## Current Status

🚧 **Early Development** - This project is just getting started!

**Implemented:**
- Basic recipe/version management system
- Tag organization
- Project grouping
- Web interface for managing recipes

**Planned:**
- MCP server integration for AI agent access
- Rich recipe templates and examples
- Advanced search and filtering
- Recipe validation and testing
- Integration with popular AI coding tools

## Tech Stack

- **Frontend**: React 19 with TanStack Start
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS v4 + Shadcn/ui
- **Code Quality**: Biome
- **Future**: MCP (Model Context Protocol) server

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuralkitchen.git
   cd neuralkitchen
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**
   ```bash
   # Configure your DATABASE_URL in .env
   pnpm db:push
   pnpm db:seed
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm check` - Run linting and formatting
- `pnpm db:studio` - Open database GUI

See [CLAUDE.md](./CLAUDE.md) for detailed development guidance.

## Contributing

This project is in early development. Contributions, ideas, and feedback are welcome!

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Neural Kitchen: Empowering AI agents with structured knowledge and proven patterns.*
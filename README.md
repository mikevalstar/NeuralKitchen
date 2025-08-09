# Neural Kitchen 🧠👨‍🍳

> A recipe/cookbook management system for AI agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/Built_with-TanStack_Start-FF6154?style=flat)](https://tanstack.com/start)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![AI Assisted](https://img.shields.io/badge/AI-Assisted-blue)](./AI_DISCLOSURE.md)

Neural Kitchen helps developers create and organize structured guidance for AI agents working on software projects. Think of it as a knowledge base that captures institutional knowledge, coding patterns, and step-by-step workflows that AI agents can follow.

## The Problem

AI agents often struggle with:
- **Lack of context**: They don't understand project-specific conventions or patterns
- **Missing institutional knowledge**: Why certain approaches are used over others, or when an old pattern is being phased out
- **Inconsistent implementations**: Without examples, they reinvent solutions differently each time
- **Limited guidance**: Hard to know which files contain good examples to follow

Humans often struggle with:
- **AI forgets**: AI tools don't remember your past conversations or corrections you made
- **AI is eager to please**: The AI tools don't stop to ask questions, they just build what they "know"
- **Forgetting about best practices**: Best practices are learned (and contextual), yours wont match the AIs

## The Kitchen

Neural Kitchen provides:
- **Recipes**: Step-by-step instructions and code examples for common development tasks written by you
- **NLP Search**: Natural language (RAG Based) search for your documentation and standards
- **Project Association**: Group recipes by codebase or project (share with other teams or projects)
- **MCP Integration**: Model Context Protocol interface for AI agents to access and search recipes

## Current Status

🚧 **Early Development** - This project is just getting started!

**Implemented:**
- Basic recipe/version management system
- Tag organization
- Project grouping
- Web interface for managing recipes
- MCP server integration for AI agent access
- Project specific MCP endpoints

**Planned:**
- Rich recipe templates and examples
- Advanced search and filtering
- Recipe validation
- Recipe auto generation
- Recipe review tools

## Tech Stack

- React 19 with TanStack Start
- PostgreSQL with Prisma ORM
- TailwindCSS v4 + Shadcn/ui
- Biome
- MCP (Model Context Protocol) server

## Getting Started

### Option 1: Docker/Podman (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikevalstar/NeuralKitchen.git
   cd NeuralKitchen
   ```

2. **Set up environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY if you want AI features
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   # or with Podman
   podman-compose up
   ```

4. **Set up database (first time only)**
   ```bash
   # In another terminal, run migrations
   docker-compose exec app pnpm db:push
   docker-compose exec app pnpm db:seed  # Optional: add sample data
   ```

The application will be available at:
- Web UI: http://localhost:3000

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikevalstar/NeuralKitchen.git
   cd NeuralKitchen
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**
   ```bash
   # Configure your DATABASE_URL in .env, and seed (optional)
   pnpm db:push
   pnpm db:seed
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## Development

- `pnpm dev` - Start development server and mcp server
- `pnpm build` - Build for production
- `pnpm check` - Run linting and formatting
- `pnpm db:studio` - Open database GUI

See [CLAUDE.md](./CLAUDE.md) for detailed AI development guidance.

## AI Development Disclosure
This project was developed with assistance from AI coding tools including Cursor and Claude. AI tools were used for code generation, debugging, and documentation throughout the development process. All code has been reviewed before addition to the project for good structure and security concerns.

## Contributing

This project is in early development. Contributions, ideas, and feedback are welcome!

This project welcomes contributions developed with or without AI assistance. Contributors using AI tools should ensure all generated code is reviewed and tested before submission and indicate the tools used in the Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Neural Kitchen: Empowering AI agents with structured knowledge and proven patterns.*
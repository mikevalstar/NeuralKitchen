# Neural Kitchen - Project Plan

## Overview
This document outlines the development phases for Neural Kitchen, a recipe/cookbook management system for AI agents. Each phase builds upon the previous one to create a comprehensive platform for capturing and sharing development knowledge.

---

## Phase 1: Core Foundation 🏗️
*Goal: Establish the fundamental recipe and project management system with MCP integration*

### 1.1 Projects Management
- [x] **Projects Database Schema**
  - [x] Update Prisma schema to include project relationships with recipes
  - [x] Add project metadata fields (description, shortId, created/updated dates)
  - [x] Implement soft delete for projects
  - [x] Run database migration

- [x] **Projects CRUD Operations**
  - [x] Create `src/lib/data/projects.ts` with namespace pattern
  - [x] Implement `Projects.list()`, `Projects.create()`, `Projects.read()`, `Projects.update()`, `Projects.delete()`
  - [x] Add Zod validation schemas in `dataValidators.ts`
  - [x] Add server functions for project operations

- [x] **Projects UI**
  - [x] Create `/projects` route with project listing
  - [x] Add project creation form with TanStack Form
  - [x] Implement project detail/edit pages
  - [x] Add project deletion with confirmation dialog
  - [x] Update navigation to include projects

### 1.2 Recipe Creation & Management
- [x] **Recipe Content System**
  - [x] Update RecipeVersion model to store markdown content
  - [x] Implement recipe content validation (ensure valid markdown)
  - [x] Add recipe tags and project relationships

- [x] **Recipe CRUD Operations**
  - [x] Create `src/lib/data/recipes.ts` with full CRUD operations
  - [x] Implement recipe versioning logic, saving creates new version automatically
  - [x] Add content hashing to prevent duplicate versions
  - [x] Implement version management (create, read, revert functionality)

- [x] **Recipe UI - Viewing**
  - [x] Create `/recipes` route with recipe listing and container queries
  - [x] Implement recipe detail page with markdown rendering using `react-markdown`
  - [x] Add metadata sidebar with tags, projects, and version info
  - [x] Create responsive recipe table with width toggle support

- [x] **Recipe UI - Editing**
  - [x] Use markdown editor `@mdxeditor/editor` with full plugin suite
  - [x] Create recipe creation form with rich text editing
  - [x] Add tag selection interface with toggle functionality
  - [x] Implement project association with detailed project cards
  - [x] Add dark mode support for MDX editor with custom styling
  - [x] Add editor mode toggle buttons (rich text, diff, source)
  - [x] Create recipe edit page with version management
  - [x] Implement automatic new version creation on save

### 1.3 Summaries, Vectorization & Search
- [x] **Make a Queue System**
  - [x] Create a data class to manage the queue, it should pop off the top 1 at a time
  - [x] Create a loop based on setTimeout to pull from the queue every 5 seconds
  - [x] When a new article is created/updated add it to the queue to summarize
- [x] **Summarize new versions of docs**
  - [x] In the loop call OPENAI to summarize the document using a cheap model (gpt-4o-mini)
  - [x] Update the version in the DB with the summary
  - [x] Show the summary on the recipe view page
- [x] **Embed Versions of Docs**
  - [x] Create vec table for search later following https://www.prisma.io/docs/postgres/database/postgres-extensions
  - [x] On the same loop call embed the first few thousand tokens (6000 tokens using text-embedding-3-small)
  - [x] Add embedding to the table following the guide above using $executeRaw
  - [x] Add proper version management - mark old embeddings as not current when new versions created
- [x] **Add vector search to UI**
  - [x] Add a search bar above the recipe list
  - [x] Add a backend search using the vector search to get the top 10 results
  - [x] Search should send you to a new page (/search) showing a google style search results (top 10 for now)
  - [x] The results should show the short summary below the title and be clickable
  - [x] Added hybrid search (vector + text fallback) for better reliability
  - [x] Added search to main navigation 
- [ ] **Add queue visualization page**
  - [ ] Add a page to the ui to see the recent and pending queued items
  - [ ] Highlight any errored items


### 1.4 MCP Server Implementation
- [x] **MCP Server Setup**
  - [x] Research and choose MCP implementation library
  - [x] Set up MCP server configuration and initialization
  - [x] Add MCP server to development startup process

- [ ] **Recipe Access Methods**
  - [ ] Implement `get_recipe` method (by ID or shortId)
  - [ ] Add `list_recipes` method with filtering options
  - [ ] Create `search_recipes` method with NLP search

- [ ] **MCP Recipe Formatting**
  - [ ] Design recipe output format for AI consumption
  - [ ] Include metadata (tags, project, version) in responses
  - [ ] Add context about when/why to use each recipe
  - [ ] Implement recipe content preprocessing for AI agents

- [ ] **MCP Documentation & Testing**
  - [ ] Create MCP server usage documentation
  - [ ] Add MCP client testing scripts
  - [ ] Document available methods and parameters
  - [ ] Test integration with popular AI tools

---

## Phase 2: Enhanced Usability 🔍
*Goal: Add search capabilities, help system, and quality-of-life improvements*

### 2.1 Search & Discovery
- [ ] **Advanced Search**
  - [ ] Implement full-text search across recipe content
  - [ ] Add search filters (tags, projects, date ranges, difficulty)
  - [ ] Create search results page with highlighting
  - [ ] Add search suggestions and autocomplete

- [ ] **Recipe Recommendations**
  - [ ] Implement "related recipes" based on tags/projects
  - [ ] Add "recently viewed" and "frequently accessed" lists
  - [ ] Create recipe dependency suggestions
  - [ ] Build "recipes you might like" algorithm

- [ ] **Enhanced Filtering**
  - [ ] Add advanced filter sidebar for recipes and projects
  - [ ] Implement tag-based filtering with counts
  - [ ] Add sorting options (date, popularity, alphabetical)
  - [ ] Create saved search/filter presets

### 2.2 Help & Documentation System
- [ ] **Help Content**
  - [ ] Create comprehensive help documentation
  - [ ] Add getting started guide for new users
  - [ ] Write best practices for recipe creation
  - [ ] Document MCP server usage and setup

- [ ] **Interactive Help**
  - [ ] Implement in-app help tooltips and tours
  - [ ] Add contextual help for different sections
  - [ ] Create recipe template gallery
  - [ ] Build FAQ section with search

- [ ] **Documentation Management**
  - [ ] Create help content management system
  - [ ] Add help content versioning
  - [ ] Implement help content search
  - [ ] Add user feedback on help articles

### 2.3 Quality of Life Improvements
- [ ] **Import/Export**
  - [ ] Add recipe export (markdown, PDF, JSON)
  - [ ] Implement bulk recipe import from files
  - [ ] Create project export with all recipes
  - [ ] Add backup/restore functionality

- [ ] **User Experience**
  - [ ] Implement keyboard shortcuts for common actions
  - [ ] Add drag-and-drop recipe organization
  - [ ] Create recipe bookmarking/favorites
  - [ ] Add recent items and quick access menus

- [ ] **Recipe Editor Enhancements**
  - [ ] Add live markdown preview
  - [ ] Implement auto-save functionality
  - [ ] Add recipe templates and snippets
  - [ ] Create collaborative editing indicators
  - [ ] Add version management interface (create new version, revert)

- [ ] **Performance & Polish**
  - [ ] Implement recipe content caching
  - [ ] Add loading states and skeleton screens
  - [ ] Optimize database queries with indexes
  - [ ] Add error boundaries and better error handling

---

## Phase 3: Advanced Features 🚀
*Goal: Add innovative features that make Neural Kitchen indispensable for AI-assisted development*

### 3.1 Recipe Intelligence
- [ ] **Recipe Validation & Testing**
  - [ ] Create recipe validation framework
  - [ ] Add recipe step verification tools
  - [ ] Implement recipe effectiveness tracking
  - [ ] Build recipe quality scoring system

- [ ] **Smart Templates**
  - [ ] Create intelligent recipe templates based on project type
  - [ ] Add template customization and branching
  - [ ] Implement template marketplace/sharing
  - [ ] Build template recommendation engine

- [ ] **Recipe Analytics**
  - [ ] Track recipe usage and success rates
  - [ ] Add recipe performance metrics
  - [ ] Create usage analytics dashboard
  - [ ] Implement A/B testing for recipe variations

### 3.2 Integration & Collaboration
- [ ] **AI Tool Integrations**
  - [ ] Add direct integration with Claude Code
  - [ ] Create VS Code extension for recipe access
  - [ ] Implement GitHub Actions for recipe validation
  - [ ] Add Cursor IDE integration

- [ ] **Team Collaboration**
  - [ ] Implement recipe commenting and discussion
  - [ ] Add recipe review and approval workflows
  - [ ] Create team recipe sharing and permissions
  - [ ] Build recipe change notifications

- [ ] **External Integrations**
  - [ ] Add Git repository integration for context
  - [ ] Implement Slack/Discord bot for recipe access
  - [ ] Create webhook system for external tools
  - [ ] Add API for third-party integrations

### 3.3 Advanced Recipe Features
- [ ] **Recipe Dependencies & Relationships**
  - [ ] Implement recipe prerequisite system
  - [ ] Add recipe composition and chaining
  - [ ] Create recipe dependency visualization
  - [ ] Build recipe workflow builders

- [ ] **Version & Change Management**
  - [ ] Add visual diff for recipe versions
  - [ ] Implement recipe branching and merging
  - [ ] Create recipe change approval process
  - [ ] Add recipe rollback and recovery

- [ ] **Content Enhancement**
  - [ ] Add interactive recipe elements (checklists, forms)
  - [ ] Implement rich media support (images, videos, diagrams)
  - [ ] Create recipe execution tracking
  - [ ] Add recipe outcome documentation

### 3.4 Platform & Ecosystem
- [ ] **Recipe Marketplace**
  - [ ] Create public recipe sharing platform
  - [ ] Add recipe rating and review system
  - [ ] Implement recipe licensing and attribution
  - [ ] Build recipe discovery and trending

- [ ] **Advanced MCP Features**
  - [ ] Add real-time recipe updates via MCP
  - [ ] Implement MCP recipe execution tracking
  - [ ] Create MCP analytics and monitoring
  - [ ] Add MCP recipe caching and optimization

- [ ] **Enterprise Features**
  - [ ] Add multi-tenant support for organizations
  - [ ] Implement enterprise authentication (SSO, LDAP)
  - [ ] Create audit logging and compliance features
  - [ ] Add enterprise-grade backup and security

---

## Success Metrics

### Phase 1 Goals
- [ ] 10+ working recipes created and tested
- [ ] MCP server successfully serving recipes to AI agents
- [ ] Basic project organization functional
- [ ] Core CRUD operations working smoothly

### Phase 2 Goals
- [ ] Sub-second search response times
- [ ] Comprehensive help system with 90%+ user satisfaction
- [ ] 50+ recipes in the system
- [ ] Import/export functionality used by 100% of active users

### Phase 3 Goals
- [ ] Recipe validation catching 95%+ of common issues
- [ ] Integration with 3+ popular AI development tools
- [ ] Active community contributing recipes
- [ ] Enterprise-ready feature set

---

## Notes
- Each checkbox represents a significant milestone that should be thoroughly tested
- Dependencies between tasks should be carefully managed
- Regular user feedback should guide priority adjustments
- Technical debt should be addressed proactively, especially in Phase 1
# Frequently Asked Questions

Common questions and answers about using Neural Kitchen.

## General Questions

### What is Neural Kitchen?
Neural Kitchen is a recipe management system designed specifically for AI agents. It stores step-by-step instructions, code examples, and best practices that AI assistants can reference when working on development tasks.

### How is this different from regular documentation?
Neural Kitchen recipes are specifically formatted for AI consumption, with:
- Structured step-by-step instructions
- Contextual guidance about when to use each recipe
- AI-generated summaries for quick discovery
- Version control for evolving best practices

## Recipe Management

### Can I edit recipes after creating them?
Yes! Neural Kitchen automatically creates new versions when you save changes. All previous versions are preserved and you can revert to any previous version if needed.

### How do AI summaries work?
When you create or update a recipe, it's automatically queued for AI processing. The system generates a concise summary using GPT-4o-mini that highlights the recipe's purpose and key technologies.

### Why aren't my search results showing up?
Search results depend on AI processing. If you just created a recipe, it may take a few moments for the embedding generation to complete. Check the queue status if searches aren't working.

## Projects and Organization

### Should I create one project per repository?
It depends on your team structure. You can organize by:
- **Repository**: One project per codebase
- **Domain**: Group by business area (auth, payments, etc.)
- **Team**: Organize by team ownership

### How many tags should I use per recipe?
Use 3-5 relevant tags focusing on:
- Primary technology (react, nodejs, etc.)
- Recipe type (setup, debugging, deployment)
- Difficulty level if relevant

## MCP Server

### Why isn't my MCP server connecting?
Check that:
- The server is running on port 3002
- Your OpenAI API key is configured in `.env`
- No other service is using port 3002

### Can multiple AI agents use the MCP server?
Yes, the server is designed to handle multiple concurrent connections from different AI agents.

## Technical Issues

### My recipes aren't getting processed by AI
Check the queue system:
1. Visit the queue page to see pending items
2. Verify your OpenAI API key is working
3. Check console logs for error messages

### Search isn't finding my recipes
This usually means:
- Recipes haven't been processed for embeddings yet
- OpenAI API issues preventing embedding generation
- Try using exact title matches as a fallback

### Can I backup my data?
Currently, your data is stored in PostgreSQL. Regular database backups are recommended. Export functionality is planned for a future release.

## Best Practices

### How detailed should recipes be?
Include enough detail that someone unfamiliar with the task could follow along successfully. Think of it as documenting for your future self or a new team member.

### Should I duplicate similar recipes?
Instead of duplicating, consider:
- Creating a base recipe and referencing it
- Using tags to differentiate variations
- Adding a "Variations" section to existing recipes

## Getting Help

### Where can I report bugs?
Check the project repository for issue tracking and bug reports.

### How can I suggest new features?
Feature requests can be submitted through the project's GitHub repository.

## Next Steps

- Learn about [Creating Recipes](creating-recipes)
- Explore [MCP Integration](mcp-server)
- Check out [Best Practices](best-practices)
- Return to [Help Home](home)
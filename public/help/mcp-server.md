# MCP Server Integration

Neural Kitchen includes a Model Context Protocol (MCP) server that allows AI agents to access your recipe library programmatically.

## What is MCP?

The Model Context Protocol is a standard for connecting AI agents to external data sources. Neural Kitchen's MCP server provides AI assistants with access to your curated recipes and development knowledge.

## Server Details

- **Port**: 3002 (runs alongside main app on port 3000)
- **Protocol**: HTTP with streamable transport
- **Format**: Stateless server for compatibility

## Available Tools

### `get_recipe`
Retrieves a single recipe with full content.

**Parameters**:
- `identifier`: Recipe ID or shortId to retrieve

**Returns**: Complete recipe content in Markdown format

### `search_recipes`
Searches recipes using the same hybrid search as the web interface.

**Parameters**:
- `query`: Search query to find relevant recipes
- `limit`: Maximum results to return (default: 10)

**Returns**: List of recipes with AI summaries and instructions to use `get_recipe` for full content

## Using with AI Assistants

### Claude Code
Neural Kitchen's MCP server is designed to work seamlessly with Claude Code and other MCP-compatible AI assistants.

### Integration Benefits
- **Contextual Guidance**: AI agents get access to your team's best practices
- **Consistent Patterns**: Agents follow established code conventions
- **Knowledge Preservation**: Institutional knowledge is accessible to AI workflows

## Server Management

### Development
```bash
pnpm dev        # Starts both web app and MCP server
pnpm mcp:dev    # Starts only MCP server in watch mode
```

### Production
```bash
pnpm mcp:start  # Starts MCP server for production
```

### Health Check
Visit `http://localhost:3002/health` to verify the server is running.

## Configuration

The MCP server automatically:
- Loads environment variables (including OpenAI API key)
- Connects to the same database as the main application
- Uses the same search and data access patterns

## Security Considerations

- **Local Access**: Server runs locally for security
- **No Authentication**: Designed for local AI agent access
- **Read-Only**: Server only provides read access to recipes

## Troubleshooting

### Common Issues
- **Connection Failed**: Verify server is running on port 3002
- **Search Not Working**: Check OpenAI API key is configured
- **No Results**: Ensure recipes exist and have been processed

### Logs
Check the console output where you started the MCP server for error messages and debugging information.

## Next Steps

- Learn about [Search and Discovery](search)
- Explore [Creating Recipes](creating-recipes)
- Check out [Best Practices](best-practices)
- Return to [Help Home](home)
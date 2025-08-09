# MCP Server Integration

Neural Kitchen includes a Model Context Protocol (MCP) server that allows AI agents to access your recipe library programmatically.

## What is MCP?

The Model Context Protocol is a standard for connecting AI agents to external data sources. Neural Kitchen's MCP server provides AI assistants with access to your curated recipes and development knowledge.

https://modelcontextprotocol.io

## Server Details

To get a sample connection string setup, visit a project page and you will get a quick setup guide for the MCP server.

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

Coming Soon...

### Logs
Check the console output where you started the MCP server for error messages and debugging information.

## Next Steps

- Learn about [Search and Discovery](search)
- Explore [Creating Recipes](creating-recipes)
- Check out [Best Practices](best-practices)
- Return to [Help Home](home)
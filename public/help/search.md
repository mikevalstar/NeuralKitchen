# Search and Discovery

Neural Kitchen provides RAG based search capabilities to help you find the right recipes quickly.

## Search Features

### Semantic Search
- **Natural Language**: "How to set up authentication"
- **Context Aware**: Finds relevant recipes even if exact words don't match
- **Similarity Based**: Uses vector embeddings to understand content relationships

### Text Search Fallback
If semantic search doesn't find results, we automatically fall back to traditional text search:
- Searches recipe titles and content
- Supports partial word matching
- Prioritizes title matches over content matches

## AI-Generated Summaries

Every recipe gets an automatically generated summary that:
- Highlights the main purpose
- Mentions key technologies
- Summarizes expected outcomes
- Helps with quick evaluation
- Are what is sent to the AI when it searches

## Next Steps

- Learn about [Creating Recipes](creating-recipes)
- Explore [MCP Integration](mcp-server)
- Check out [Project Organization](projects)
- Return to [Help Home](home)
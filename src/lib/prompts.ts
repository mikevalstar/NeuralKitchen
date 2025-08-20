/**
 * Default AI prompts used throughout the application
 * These serve as fallback values when no custom prompts are configured in the database
 */

export const DEFAULT_PROMPTS = {
  RECIPE_SUMMARY_SYSTEM: `You are an AI assistant that creates concise summaries of code development recipes/tutorials and code documentation. Your summaries should:

1. Be 5 paragraphs maximum
2. It should be written in markdown format
3. Should be written in the same language, tone and style as the original content
4. Focus on the main purpose and key outcome
5. Mention the primary technology/framework if relevant  
6. Be written so that it has all keywords and phrases that would be used to search for this recipe
7. Avoid implementation details - focus on the "what" and "why"

Keep the summary professional and actionable.`,

  RECIPE_SUMMARY_USER: `Please summarize this development recipe:

Title: {title}

Content:
{content}`,

  MCP_SERVER_DESCRIPTION: `A MCP server providing AI coding assistants with reusable recipes and procedures for common tasks and projects. It is a collection of recipes and procedures for use in determining next steps on a task and prescriptive instructions.`,

  MCP_SERVER_INSTRUCTIONS: `This provides a list of reusable tasks and procedures also known as cookbooks or recipes for use in determining next steps on a task and prescriptive instructions.

The recipe, cookbook, or procedure is a list of steps to complete a task.
The recipe, cookbook, or procedure is written in markdown format.
The recipe, cookbook, or procedure is written in a way that is easy to understand and follow.

**CRITICAL: Before starting ANY task, you MUST search for existing recipes first using the search_recipes tool. Only proceed with custom
  implementation if no relevant recipe exists.**

When you know the name of the recipe, cookbook, or procedure you want to use, you can use the get_recipe tool to read the recipe, cookbook, or procedure.

You should follow these recipes when there is one available, it will help you complete the task. Always search for a recipe before starting a new task.`,
} as const;

export const PROMPT_METADATA = {
  RECIPE_SUMMARY_SYSTEM: {
    title: "Recipe Summary System Prompt",
    description:
      "System instructions for AI when generating recipe summaries. Controls the format, length, and focus of auto-generated summaries.",
  },
  RECIPE_SUMMARY_USER: {
    title: "Recipe Summary User Prompt",
    description:
      "Template for the user message sent to AI for recipe summarization. Uses {title} and {content} placeholders.",
  },
  MCP_SERVER_DESCRIPTION: {
    title: "MCP Server Description",
    description:
      "Description text shown to AI agents when they connect to the MCP server. Explains what Neural Kitchen provides.",
  },
  MCP_SERVER_INSTRUCTIONS: {
    title: "MCP Server Instructions",
    description:
      "Detailed instructions for AI agents on how to use Neural Kitchen recipes effectively through the MCP interface.",
  },
} as const;

export type PromptKey = keyof typeof DEFAULT_PROMPTS;

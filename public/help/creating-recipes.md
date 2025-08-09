# Creating Recipes

Learn how to create effective recipes for your AI development workflows.

## Creating Your First Recipe

1. **Navigate to Recipes** - Click on "Recipes" in the main navigation
2. **Click "Add Recipe"** - Use the prominent create button
3. **Fill in the Details**:
   - **Title**: Give your recipe a descriptive name
   - **Short ID**: A unique identifier
   - **Recipe Content**: Write your step-by-step instructions in Markdown
   - **Projects**: Select 1 or more projects this recipe should belong to
   - **Tags**: Some quick tags you can attach to your recipes for organization

## Writing Effective Recipe Content

### Structure Your Recipe

```markdown
# Problem Statement
Describe what this recipe solves

## Prerequisites
- List any requirements
- Dependencies needed
- Knowledge assumed

## Steps
1. First step with clear instructions
2. Second step with code examples
3. Final step with verification

## Expected Outcome
What should happen when complete

## Testing
How do you ensure it was done correctly
```

### Best Practices

- **Be Specific**: Include exact commands and file paths
- **Add Context**: Explain why each step is necessary  
- **Include Examples**: Show actual code snippets
- **Include Example Paths**: Link to implemented files following this practice
- **Test Your Recipe**: Follow your own instructions

## Organizing with Tags and Projects

- **Tags**: Use for categorizing by technology (e.g., "react", "database", "testing")
- **Projects**: Group recipes by codebase or domain (e.g., "ecommerce-app", "auth-service")

## Version Management

Neural Kitchen automatically creates new versions when you save changes:
- Previous versions are preserved
- You can revert to any previous version (coming soon)
- AI summaries are generated for each version, used for search (both for you and the AI)

## Samples

You can use the recipes used by Neural Kitchen itself from the seed here: https://github.com/mikevalstar/NeuralKitchen/tree/main/prisma/seeds

## Next Steps

- Learn about [Project Organization](projects)
- Explore [Best Practices](best-practices)
- Return to [Help Home](home)
# Recipe Best Practices

Guidelines for writing effective recipes that AI agents can follow successfully.

## Mental Model
When dealing with an LLM it is best to remember that it does not remember any previous tasks, and may or may not look at your current code before starting. 

With this in mind, be very detailed in your recipes to keep your code consistent.

Note: Your recipes are project specific or specific to your personal style, for how to use specific public libraries or tools it is best to link directly to their `llms.txt` file or their documentation website directly in the recipe. 

## Writing Style

### Be Explicit and Specific
- Use exact commands, not "run the build script"
- Include full file paths (relative to the project root): `src/components/Button.tsx`
- Specify versions when relevant: `Node.js 20+`

### Structure for Scanning
AI agents scan content quickly, so structure helps:

```markdown
## Problem
What this solves

## Prerequisites  
- Required tools
- Knowledge assumed

## Solution
Step-by-step instructions

## Verification
How to confirm success
```

## Content Guidelines

### Add Requirements
Where something cannot be known at the time of writing the recipe, tell the AI to ask questions before beginning if it doesn't have the answer to the question. 

### Include Context
- **Why**: Explain the reasoning behind each step
- **When**: Describe when to use this recipe vs alternatives
- **Dependencies**: List what must be done first

### Code Examples
Always include:
- Complete, runnable code snippets
- Expected outputs
- Common variations
- Error handling
- Documentation requirements

### Example Recipe Structure
```markdown
# Adding a new field

## Problem
You need to add a new field to an existing object

## Technology
- Node 20+
- Typescript
- Prisma 6+

## Solution

### 1. Add field to schema `prisma/schema.prisma`

- Always include a single line comment explaining the use of the field
- Field names should be least specific to most specific to help with sorting when using autocomplete tools e.g. `DateUpdatedDescription`

### 2. Generate a migration Script

`pnpx prisma migrate dev --name {descriptive name}`

### 3. Update the class object in `src/lib/data/`
Each db object has an associated db object in the data folder. Update it so CRUD operations work as directed by the user. 

### 4. Update the UI 
If you do not know what UI pages are required to be updated, ask the user.

Update the UI following the style of the page. Read other recipes if you are asked to style it in a specific way.

## Verification
Run `pnpm check` to verify the code is syntactically correct

Run `pnpm lint` to check linting rules, `pnpm lint:fix` can often fix simple mistakes like unsorted imports.
```

## Common Patterns

### Decision Trees
When there are multiple approaches:

```markdown
## Choose Your Approach

### For New Projects
Use approach A because...

### For Legacy Projects
Use approach B because...

### For Complex Requirements
Consider approach C if...
```

### Troubleshooting Sections
Include common issues you see the AI make:

```markdown
## Common Issues

### Error: "Module not found"
**Cause**: Missing dependency
**Solution**: Run `pnpm install package-name`

### Error: "Permission denied"
**Cause**: File permissions
**Solution**: Run `chmod +x script.sh`
```

## Maintenance

_tools coming soon to assist_

### Keep Recipes Current
- Update when tools change versions
- Verify examples still work
- Add new approaches as they emerge

### Version Your Changes
Neural Kitchen automatically versions recipes, so:
- Make meaningful changes, not just typos fixes in separate saves
- Test before saving new versions

### Cross-Reference Related Recipes
Link to related recipes:
- Prerequisites: "First complete recipe `xyz`"
- Alternatives: "For a simpler approach, recipe `qrs`"

## AI-Specific Considerations

### Write for AI Consumption
- Use consistent terminology throughout
- Avoid ambiguous pronouns ("it", "this", "that")
- Be explicit about assumptions
- Over describe the task

### Structure for Understanding
- Lead with the most important information
- Use headers for easy navigation
- Include summaries for complex procedures

## Testing Your Recipes

### Before Publishing
1. **Follow Your Own Instructions**: Can you complete the task?
2. **Test Edge Cases**: What if prerequisites are missing?
3. **Verify Examples**: Do all code snippets work?
4. **Check Links**: Do references to other recipes work?

## Next Steps

- Learn about [Creating Recipes](creating-recipes)
- Explore [Project Organization](projects)
- Check out [Search and Discovery](search)
- Return to [Help Home](home)
# Recipe Best Practices

Guidelines for writing effective recipes that AI agents can follow successfully.

## Writing Style

### Be Explicit and Specific
- Use exact commands, not "run the build script"
- Include full file paths: `src/components/Button.tsx`
- Specify versions when relevant: `Node.js 18+`

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

### Example Recipe Structure
```markdown
# Setting Up React Testing Library

## Problem
Configure testing for React components with proper mocking and utilities.

## Prerequisites
- React 18+ project
- npm/pnpm package manager
- Basic understanding of testing concepts

## Solution

### 1. Install Dependencies
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
```

### 2. Configure Test Setup
Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

### 3. Update vite.config.ts
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
})
```

## Verification
Run `pnpm test` to verify the setup works correctly.
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
Always include common issues:

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

### Keep Recipes Current
- Update when tools change versions
- Verify examples still work
- Add new approaches as they emerge

### Version Your Changes
Neural Kitchen automatically versions recipes, so:
- Make meaningful changes, not just typos fixes in separate saves
- Include version notes in commit-like descriptions
- Test before saving new versions

### Cross-Reference Related Recipes
Link to related recipes:
- Prerequisites: "First complete [Project Setup](project-setup)"
- Alternatives: "For a simpler approach, see [Quick Setup](quick-setup)"
- Follow-ups: "Next, configure [Deployment](deployment)"

## AI-Specific Considerations

### Write for AI Consumption
- Use consistent terminology throughout
- Avoid ambiguous pronouns ("it", "this", "that")
- Be explicit about assumptions

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

### After Publishing
1. **Monitor Usage**: Are people/agents using this recipe?
2. **Collect Feedback**: What questions come up?
3. **Update Based on Evolution**: Have tools or best practices changed?

## Next Steps

- Learn about [Creating Recipes](creating-recipes)
- Explore [Project Organization](projects)
- Check out [Search and Discovery](search)
- Return to [Help Home](home)
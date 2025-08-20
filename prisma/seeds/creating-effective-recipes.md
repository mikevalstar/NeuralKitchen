---
title: "Creating Effective Recipes for AI Agents"
shortId: "creating-effective-recipes"
projects: ["NeuralKitchen"]
tags: ["Meta", "Documentation", "LLM Best Practices"]
---

# Creating Effective Recipes for AI Agents

This meta recipe guides you through creating high-quality recipes for Neural Kitchen that AI agents can effectively follow.

## Recipe Structure

### Required Front Matter
```yaml
---
title: "Descriptive Recipe Title"
shortId: "kebab-case-identifier"
projects: ["Project Name"]
tags: ["Category1", "Category2"]
---
```

### Content Sections
1. **Title & Brief Description** - Clear, actionable title with 1 sentence overview
2. **Prerequisites** - Dependencies, tools, or knowledge required
3. **Steps** - Numbered, sequential instructions with code examples
4. **Expected Outcome** - What success looks like

## LLM Best Practices

### 1. Be Specific and Contextual
- Use precise language and define all terms
- Provide clear context about the codebase, framework, or environment
- Include relevant file paths and line numbers when applicable
- Include URLs with additional documentation, especially if there is a llms.txt URL to use

### 2. Structure for Reasoning
- Break complex tasks into logical steps
- Use "Think step by step" approach for multi-part processes
- Include decision points and conditional logic when needed

### 3. Format for Machine Readability
- Use consistent markdown formatting
- Structure code blocks with language tags
- Include expected outputs or error states

### 4. Include Examples and Anti-patterns
- Show working code examples
- Highlight common mistakes to avoid
- Provide troubleshooting guidance

## Recipe Creation Process

### 1. Identify the Pattern
- What recurring development task does this solve?
- What institutional knowledge needs capturing?
- What context do AI agents typically lack?
- Ask the user to clarify items if you cannot answer the above

### 2. Document Prerequisites
```markdown
## Prerequisites
- Node.js 18+ installed
- Existing React project
- Familiarity with TypeScript
```

### 3. Write Step-by-Step Instructions
- Use imperative mood ("Create", "Install", "Configure")
- Include code snippets with explanations
- Provide file paths and specific locations for golden masters for best practices
- Add verification steps

### 4. Define Success Criteria
```markdown
## Expected Outcome
- Feature works as intended
- Tests pass
- Code follows project conventions
```

## Storage and Organization

### File Location
Save recipes in `prisma/seeds/` directory with descriptive filename:
```
prisma/seeds/recipe-name.md
```

### Project Assignment
Always assign to appropriate project(s):
- "NeuralKitchen" for meta/framework recipes
- Specific project names for domain-specific guidance

### Tagging Strategy
Use consistent tags for discoverability:
- Technical: "Frontend", "Backend", "Database", "Testing"
- Conceptual: "Architecture", "Security", "Performance"
- Meta: "Documentation", "LLM Best Practices"

## Quality Checklist

- [ ] Clear, actionable title
- [ ] Proper front matter with shortId, projects, and tags
- [ ] Prerequisites clearly stated
- [ ] Steps are sequential and testable
- [ ] Code examples are complete and correct
- [ ] Expected outcome is measurable
- [ ] Language is precise and unambiguous
- [ ] Includes troubleshooting guidance
- [ ] Follows project conventions and patterns

## Tips for AI Agent Effectiveness

1. **Assume No Prior Context** - AI agents don't remember previous conversations
2. **Include File Paths** - Always specify exact locations
3. **Provide Complete Examples** - Partial code snippets lead to errors
4. **Use Consistent Terminology** - Match the project's existing vocabulary
5. **Test Instructions** - Ensure steps can be followed independently

Remember: These recipes will be used by AI agents to maintain consistency and quality across the project. Make them clear, complete, and actionable.
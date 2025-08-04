import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Projects } from "../src/lib/data/projects.js";
import { Recipes } from "../src/lib/data/recipes.js";
import { Tags } from "../src/lib/data/tags.js";

const prisma = new PrismaClient();

export async function main() {
  console.log("🌱 Starting database seed...");

  // Create Tags
  console.log("📄 Creating tags...");
  const tagNames = [
    "Frontend",
    "Backend",
    "Database",
    "Testing",
    "Deployment",
    "API",
    "Authentication",
    "Performance",
    "Security",
    "Debugging",
  ];

  const createdTags = [];
  for (const name of tagNames) {
    try {
      const tag = await Tags.create({ name });
      createdTags.push(tag);
      console.log(`  ✅ Created tag: ${name}`);
    } catch (error) {
      console.log(error);
      console.log(`  ⚠️  Tag "${name}" might already exist`);
      // Find existing tag
      const existingTag = await prisma.tag.findFirst({ where: { name, deletedAt: null } });
      if (existingTag) createdTags.push(existingTag);
    }
  }

  // Create Projects
  console.log("📁 Creating projects...");
  const projectsData = [
    {
      title: "React Component Library",
      shortId: "react-components",
      description:
        "Best practices and patterns for building reusable React components with TypeScript and testing strategies.",
    },
    {
      title: "Node.js API Development",
      shortId: "nodejs-api",
      description:
        "Guidelines for building scalable REST APIs with Node.js, Express, authentication, and database integration.",
    },
    {
      title: "Full Stack Web Application",
      shortId: "fullstack-webapp",
      description:
        "Complete workflows for building modern web applications from database design to deployment and monitoring.",
    },
  ];

  const createdProjects = [];
  for (const projectData of projectsData) {
    try {
      const project = await Projects.create(projectData);
      createdProjects.push(project);
      console.log(`  ✅ Created project: ${projectData.title}`);
    } catch (error) {
      console.log(error);
      console.log(`  ⚠️  Project "${projectData.title}" might already exist`);
      // Find existing project
      const existingProject = await prisma.project.findFirst({
        where: { shortId: projectData.shortId, deletedAt: null },
      });
      if (existingProject) createdProjects.push(existingProject);
    }
  }

  // Create Recipes
  console.log("🍳 Creating recipes...");
  const recipesData = [
    {
      recipe: { title: "Setting up React with TypeScript", shortId: "react-typescript-setup" },
      version: {
        title: "Setting up React with TypeScript",
        content: `# Setting up React with TypeScript

This recipe guides you through setting up a new React project with TypeScript from scratch.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Steps

### 1. Create New React App
\`\`\`bash
npx create-react-app my-app --template typescript
cd my-app
\`\`\`

### 2. Install Additional Dependencies
\`\`\`bash
npm install @types/react @types/react-dom
\`\`\`

### 3. Configure TypeScript
Update \`tsconfig.json\` with strict settings:
\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
\`\`\`

## Expected Outcome
- Fully configured React + TypeScript project
- Type-safe component development
- Better IDE support and error catching`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "Database Migration Strategy", shortId: "database-migrations" },
      version: {
        title: "Database Migration Strategy",
        content: `# Database Migration Strategy

Best practices for handling database schema changes in production applications.

## Migration Principles

### 1. Always Backwards Compatible
- Add columns, don't remove
- Create new tables before dropping old ones
- Use feature flags for breaking changes

### 2. Test Migrations Thoroughly
\`\`\`bash
# Test on copy of production data
pg_dump production_db | psql test_db
npm run migrate:test
\`\`\`

### 3. Rollback Strategy
Every migration should have a rollback:
\`\`\`sql
-- Migration up
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Migration down  
ALTER TABLE users DROP COLUMN email_verified;
\`\`\`

## Deployment Checklist
- [ ] Test migration on staging
- [ ] Verify rollback procedure
- [ ] Monitor performance impact
- [ ] Update documentation`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "API Authentication with JWT", shortId: "jwt-authentication" },
      version: {
        title: "API Authentication with JWT",
        content: `# API Authentication with JWT

Implementing secure JWT-based authentication for REST APIs.

## JWT Token Structure

### Access Token (Short-lived)
- Expires in 15-30 minutes
- Contains user ID and permissions
- Used for API requests

### Refresh Token (Long-lived)
- Expires in 7-30 days
- Used to get new access tokens
- Stored securely, can be revoked

## Implementation

### 1. Login Endpoint
\`\`\`javascript
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authenticateUser(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  res.json({ accessToken, refreshToken });
});
\`\`\`

### 2. Protected Route Middleware
\`\`\`javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
\`\`\`

## Security Considerations
- Use strong secret keys
- Implement token rotation
- Add rate limiting
- Log authentication attempts`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "React Component Testing", shortId: "react-component-testing" },
      version: {
        title: "React Component Testing",
        content: `# React Component Testing

Comprehensive guide to testing React components with Jest and React Testing Library.

## Testing Philosophy
- Test behavior, not implementation
- Write tests from user perspective
- Keep tests simple and focused

## Test Structure

### 1. Component Rendering Test
\`\`\`javascript
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

test('displays user name and email', () => {
  const user = { name: 'John Doe', email: 'john@example.com' };
  
  render(<UserProfile user={user} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
\`\`\`

### 2. User Interaction Test
\`\`\`javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('increments counter when button clicked', () => {
  render(<Counter />);
  
  const button = screen.getByRole('button', { name: /increment/i });
  const counter = screen.getByText('Count: 0');
  
  fireEvent.click(button);
  
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
\`\`\`

### 3. Async Operation Test  
\`\`\`javascript
test('loads and displays user data', async () => {
  const mockUser = { id: 1, name: 'Jane Doe' };
  jest.spyOn(api, 'fetchUser').mockResolvedValue(mockUser);
  
  render(<UserLoader userId={1} />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});
\`\`\`

## Best Practices
- Use data-testid sparingly
- Mock external dependencies
- Test error states
- Keep tests DRY with custom render functions`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "Docker Deployment Setup", shortId: "docker-deployment" },
      version: {
        title: "Docker Deployment Setup",
        content: `# Docker Deployment Setup

Complete guide for containerizing and deploying applications with Docker.

## Dockerfile Best Practices

### Multi-stage Build
\`\`\`dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Optimization Techniques
- Use .dockerignore file
- Leverage build cache with layer ordering
- Use specific base image versions
- Run as non-root user

## Docker Compose Configuration

### Development Environment
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
  
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\`

## Deployment Checklist
- [ ] Health check endpoint implemented
- [ ] Environment variables configured
- [ ] Database migrations handled
- [ ] Logging configured
- [ ] Security scan completed
- [ ] Resource limits set`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "Performance Optimization Checklist", shortId: "performance-optimization" },
      version: {
        title: "Performance Optimization Checklist",
        content: `# Performance Optimization Checklist

Systematic approach to identifying and fixing performance bottlenecks.

## Frontend Optimization

### Bundle Analysis
\`\`\`bash
# Analyze bundle size
npm run build -- --analyze
npx webpack-bundle-analyzer build/static/js/*.js
\`\`\`

### Code Splitting
\`\`\`javascript
// Route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Component-based splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
\`\`\`

### Image Optimization
- Use WebP format when possible
- Implement lazy loading
- Serve responsive images
- Compress images (80-85% quality)

## Backend Optimization

### Database Performance
\`\`\`sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
\`\`\`

### Caching Strategy
\`\`\`javascript
// Redis caching example
const getCachedUser = async (userId) => {
  const cached = await redis.get(\`user:\${userId}\`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.user.findById(userId);
  await redis.setex(\`user:\${userId}\`, 300, JSON.stringify(user));
  return user;
};
\`\`\`

## Monitoring & Metrics
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- Database query performance
- API response times
- Error rates and crash analytics

## Performance Budget
- JavaScript bundle < 200KB
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Database queries < 100ms
- API endpoints < 500ms`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "Error Handling Best Practices", shortId: "error-handling" },
      version: {
        title: "Error Handling Best Practices",
        content: `# Error Handling Best Practices

Comprehensive error handling strategies for robust applications.

## Frontend Error Handling

### React Error Boundaries
\`\`\`javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    // Send to error reporting service
    errorReporting.captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
\`\`\`

### Async Error Handling
\`\`\`javascript
const fetchUserData = async (userId) => {
  try {
    const response = await api.get(\`/users/\${userId}\`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new UserNotFoundError('User not found');
    }
    if (error.response?.status >= 500) {
      throw new ServerError('Server error occurred');
    }
    throw new NetworkError('Network request failed');
  }
};
\`\`\`

## Backend Error Handling

### Express Error Middleware
\`\`\`javascript
const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Don't leak sensitive information
  if (process.env.NODE_ENV === 'production') {
    if (err.status === 500) {
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
\`\`\`

### Custom Error Classes
\`\`\`javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.status = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(\`\${resource} not found\`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}
\`\`\`

## Error Monitoring
- Implement structured logging
- Use error tracking services (Sentry, Bugsnag)
- Set up alerts for critical errors
- Monitor error rates and trends
- Create error dashboards

## User Experience
- Show helpful error messages
- Provide recovery actions
- Implement retry mechanisms
- Graceful degradation
- Loading and error states`,
        tagIds: [],
        projectIds: [],
      },
    },
    {
      recipe: { title: "Git Workflow and Best Practices", shortId: "git-workflow" },
      version: {
        title: "Git Workflow and Best Practices",
        content: `# Git Workflow and Best Practices

Efficient Git workflows for team collaboration and code quality.

## Branch Strategy

### GitFlow Model
\`\`\`
main (production)
├── develop (integration)
    ├── feature/user-authentication
    ├── feature/payment-integration
    └── hotfix/critical-bug-fix
\`\`\`

### Branch Naming Conventions
- \`feature/\` - New features
- \`bugfix/\` - Bug fixes
- \`hotfix/\` - Critical production fixes
- \`chore/\` - Maintenance tasks
- \`docs/\` - Documentation updates

## Commit Best Practices

### Conventional Commits
\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

### Examples
\`\`\`
feat(auth): add JWT token validation
fix(api): resolve user registration bug
docs(readme): update installation instructions
chore(deps): upgrade React to v18
\`\`\`

## Useful Git Commands

### Interactive Rebase
\`\`\`bash
# Clean up commits before merging
git rebase -i HEAD~3

# Squash commits
pick abc1234 feat: add user model
squash def5678 fix: typo in user model
squash ghi9012 refactor: improve user model structure
\`\`\`

### Stash Management
\`\`\`bash
# Save work in progress
git stash push -m "WIP: user authentication"

# List stashes
git stash list

# Apply specific stash
git stash apply stash@{1}
\`\`\`

### Cherry Pick
\`\`\`bash
# Apply specific commit to current branch
git cherry-pick abc1234
\`\`\`

## Pull Request Guidelines

### PR Template
\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
\`\`\`

## Pre-commit Hooks
\`\`\`json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["stylelint --fix", "prettier --write"]
  }
}
\`\`\`

## Release Management
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases with \`git tag v1.2.3\`
- Generate changelogs automatically
- Automate deployments with CI/CD`,
        tagIds: [],
        projectIds: [],
      },
    },
  ];

  const createdRecipes = [];
  for (let i = 0; i < recipesData.length; i++) {
    const { recipe, version } = recipesData[i];

    try {
      // Assign some tags and projects randomly
      const randomTags = createdTags
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map((tag) => tag.id);

      const randomProjects = createdProjects
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1)
        .map((project) => project.id);

      const result = await Recipes.create(recipe, {
        ...version,
        tagIds: randomTags,
        projectIds: randomProjects,
      });

      createdRecipes.push(result);
      console.log(`  ✅ Created recipe: ${recipe.title}`);
    } catch (error) {
      console.log(error);
      console.log(`  ⚠️  Recipe "${recipe.title}" might already exist`);
    }
  }

  console.log("\n🎉 Database seeding completed!");
  console.log(`📊 Summary:`);
  console.log(`  - Tags: ${createdTags.length}`);
  console.log(`  - Projects: ${createdProjects.length}`);
  console.log(`  - Recipes: ${createdRecipes.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

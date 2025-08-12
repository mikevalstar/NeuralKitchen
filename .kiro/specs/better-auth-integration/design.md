# Design Document

## Overview

This design implements BetterAuth authentication integration with our existing TanStack Start and Prisma architecture. The solution provides secure email/password authentication with admin-only user management through a CLI tool, while maintaining consistency with our current tech stack and design patterns.

## Architecture

### Authentication Flow
```
User Login Request → BetterAuth Handler → Prisma Database → Session Creation → Client State Update
```

### Component Architecture
```
Navigation Component → UserAvatar Component → Auth Context → BetterAuth Client
                                          ↓
Login Page → Auth Forms → BetterAuth API → Server Handler
```

### Database Integration
```
Existing Prisma Schema → BetterAuth Tables → Unified Database Connection
```

## Components and Interfaces

### 1. BetterAuth Configuration

**File**: `src/lib/auth.ts`
- Configure BetterAuth with Prisma adapter
- Disable sign-up functionality using `disableSignUp: true`
- Set up email/password authentication
- Configure session management (7-day expiration)
- Set trusted origins for CSRF protection

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // matches our current setup
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Prevent web-based registration
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24,     // 1 day in seconds
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
```

### 2. Database Schema Extensions

**Process**: Use BetterAuth CLI to generate schema, then integrate with existing Prisma schema
- Run `npx better-auth generate` to create BetterAuth tables
- Use `prisma db pull` to read the generated database schema into `prisma/schema.prisma`
- Merge with existing models while maintaining UUID primary keys
- Required BetterAuth tables: `User`, `Session`, `Account`, `Verification`

**Expected Schema Structure**:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
  accounts  Account[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Verification {
  id         String   @id @default(uuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  
  @@unique([identifier, value])
}
```

**Integration Steps**:
1. Configure BetterAuth with database connection
2. Run `npx better-auth generate` to create tables in database
3. Run `prisma db pull` to sync schema file with database
4. Manually adjust any inconsistencies (ensure UUID primary keys)
5. Run `prisma generate` to update Prisma client

### 3. API Route Integration

**File**: `src/routes/api/auth/$.ts`
- TanStack Start API route handler
- Integrate BetterAuth handler
- Handle all auth endpoints: `/api/auth/*`

```typescript
interface AuthHandler {
  GET: (request: Request) => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
  PUT: (request: Request) => Promise<Response>;
  DELETE: (request: Request) => Promise<Response>;
}
```

### 4. Client-Side Authentication

**File**: `src/lib/auth-client.ts`
- BetterAuth client configuration for React
- React hooks for authentication state
- Session management utilities

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL, // Optional if API matches frontend
});

// Export commonly used methods for convenience
export const { signIn, signOut, useSession } = authClient;

// Available client methods:
interface AuthClient {
  signIn: {
    email: (credentials: { email: string; password: string; callbackURL?: string }) => Promise<AuthResult>;
  };
  signOut: (options?: { fetchOptions?: { onSuccess?: () => void } }) => Promise<void>;
  useSession: () => { data: Session | null; isPending: boolean; error: Error | null };
  getSession: () => Promise<{ data: Session | null; error: Error | null }>;
}
```

### 5. User Avatar Component

**File**: `src/components/UserAvatar.tsx`
- Display user authentication status
- Dropdown menu with user info and logout
- Integration with Navigation component

```typescript
interface UserAvatarProps {
  user: {
    email: string;
    name?: string;
    image?: string;
  };
  onSignOut: () => void;
}
```

### 6. Login Page

**File**: `src/routes/login.tsx`
- Email and password form
- Form validation with Zod
- Error handling and display
- Redirect after successful login

```typescript
interface LoginForm {
  email: string;
  password: string;
}

interface LoginPageState {
  isLoading: boolean;
  error: string | null;
}
```

### 7. CLI User Management Tool

**File**: `scripts/manage-users.ts`
- Add user functionality
- List users functionality  
- Delete user functionality
- Direct Prisma database access

```typescript
interface CLICommands {
  addUser: (email: string, password: string) => Promise<void>;
  listUsers: () => Promise<User[]>;
  deleteUser: (email: string) => Promise<void>;
}
```

### 8. Route Protection

**File**: `src/lib/auth-guard.ts`
- Route protection middleware
- Redirect unauthenticated users
- Session validation

```typescript
interface AuthGuard {
  requireAuth: (context: RouteContext) => Promise<void>;
  redirectIfAuthenticated: (context: RouteContext) => Promise<void>;
}
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Model
```typescript
interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  user: User;
}
```

### Authentication State
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

## Error Handling

### Authentication Errors
- Invalid credentials: Display generic error message
- Session expired: Redirect to login with message
- Network errors: Display retry option
- Database errors: Log and display generic error

### CLI Tool Errors
- Database connection failures
- Duplicate email addresses
- User not found errors
- Invalid password format

### Form Validation
- Email format validation
- Password length requirements (minimum 8 characters)
- Required field validation
- Real-time validation feedback

## Testing Strategy

### Unit Tests
- BetterAuth configuration validation
- Form validation logic
- CLI tool functions
- Authentication utilities

### Integration Tests
- Login flow end-to-end
- Session management
- Route protection
- Database operations

### Manual Testing
- User login/logout flow
- CLI user management commands
- Session expiration handling
- Error scenarios

### Security Testing
- CSRF protection validation
- Session security
- Password hashing verification
- SQL injection prevention

## Implementation Notes

### Dependencies to Add
- `better-auth`: Core authentication library (includes Prisma adapter)

### Environment Variables
- `BETTER_AUTH_SECRET`: Secret key for encryption/signing
- `BETTER_AUTH_URL`: Base URL for authentication (defaults to baseURL)

### Database Migration
- Create migration for BetterAuth tables
- Ensure UUID primary keys are maintained
- Add indexes for performance

### Security Considerations
- Disable public registration endpoints
- Implement proper CSRF protection
- Use secure session cookies
- Hash passwords with scrypt algorithm
- Validate trusted origins

### Performance Considerations
- Session caching in cookies (5-minute cache)
- Database connection pooling
- Efficient session queries
- Minimal client bundle size impact
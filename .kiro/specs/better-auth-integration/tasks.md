# Implementation Plan

- [x] 1. Install dependencies and setup environment
  - Install `better-auth` package
  - Add required environment variables to `.env` and `.env.example`
  - Generate BETTER_AUTH_SECRET using CLI
  - _Requirements: 4.4, 5.4_

- [x] 2. Create BetterAuth server configuration
  - Create `src/lib/auth.ts` with BetterAuth instance
  - Configure Prisma adapter with existing database connection
  - Set up email/password authentication with sign-up disabled
  - Configure session management and trusted origins
  - _Requirements: 4.1, 4.4, 5.6_

- [ ] 3. Generate and integrate database schema
  - Run `npx @better-auth/cli generate` to create BetterAuth tables - Dont by user
  - Use `prisma db pull` to sync schema with database - Done by user
  - Manually adjust schema to ensure UUID primary keys
  - Run `prisma generate` to update Prisma client
  - Create and run database migration
  - _Requirements: 4.2, 4.3, 4.5_

- [ ] 4. Create TanStack Start API route handler
  - Create `src/routes/api/auth/$.ts` catch-all route
  - Integrate BetterAuth handler with TanStack Start
  - Test API endpoints are accessible at `/api/auth/*`
  - _Requirements: 5.1, 5.4_

- [ ] 5. Create client-side authentication setup
  - Create `src/lib/auth-client.ts` with BetterAuth React client
  - Export commonly used authentication methods
  - Configure client with proper base URL
  - _Requirements: 5.3_

- [ ] 6. Create login page and form
  - Create `src/routes/login.tsx` route
  - Implement login form with email and password fields
  - Add form validation using Zod and TanStack Form
  - Handle authentication errors and display messages
  - Redirect to main app after successful login
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. Create user avatar component
  - Create `src/components/UserAvatar.tsx` component
  - Display user email/name with dropdown menu
  - Include logout functionality in dropdown
  - Handle loading and error states
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Integrate user avatar into navigation
  - Update `src/components/Navigation.tsx` to include UserAvatar
  - Show avatar only when user is authenticated
  - Position avatar in upper right corner
  - Handle authentication state changes
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 9. Implement route protection middleware
  - Create authentication middleware for TanStack Router
  - Add beforeLoad middleware to protect routes from unauthenticated access
  - Redirect unauthenticated users to login page
  - Handle session validation and expiration in middleware
  - Apply middleware to existing protected routes
  - _Requirements: 5.2_

- [ ] 10. Create CLI user management tool
  - Create `scripts/manage-users.ts` CLI script
  - Implement add-user command with email and password
  - Implement list-users command to display all users
  - Implement delete-user command to remove users
  - Add proper error handling and validation
  - Update package.json with CLI scripts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 11. Test authentication flow
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test session persistence and expiration
  - Test logout functionality
  - Test CLI user management commands
  - Verify CSRF protection is working
  - _Requirements: 1.2, 1.3, 1.5, 3.3, 5.5_

- [ ] 12. Update documentation and environment setup
  - Update README with authentication setup instructions
  - Document CLI user management commands
  - Add authentication environment variables to deployment guides
  - Create initial admin user setup instructions
  - _Requirements: 2.1_
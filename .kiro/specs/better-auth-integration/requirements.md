# Requirements Document

## Introduction

This feature implements basic authentication functionality using BetterAuth library integrated with our existing TanStack Start and Prisma setup. The authentication system will provide email/password login without email verification, include a CLI tool for user management, and add a user avatar component to the UI. The scope explicitly excludes linking user actions throughout the app - focusing solely on login/logout functionality.

## Requirements

### Requirement 1

**User Story:** As a user, I want to login with email and password, so that I can access the Neural Kitchen application securely.

#### Acceptance Criteria

1. WHEN a user visits the login page THEN the system SHALL display only email and password input fields (no registration form)
2. WHEN a user submits valid credentials THEN the system SHALL authenticate them using BetterAuth and create a secure session
3. WHEN a user submits invalid credentials THEN the system SHALL display an appropriate error message without revealing sensitive information
4. WHEN a user attempts to access registration endpoints THEN the system SHALL return an error or redirect to login
5. WHEN a user's session expires (after 7 days by default) THEN the system SHALL redirect them to the login page
6. WHEN a user tries to register through the web interface THEN the system SHALL not provide any registration functionality

### Requirement 2

**User Story:** As an administrator, I want a CLI tool to manage users, so that I can easily add the first user and manage accounts without using the web interface.

#### Acceptance Criteria

1. WHEN an administrator runs the CLI add-user command with email and password THEN the system SHALL create a new user account using BetterAuth's password hashing
2. WHEN an administrator runs the CLI list-users command THEN the system SHALL display all registered users with their email, name, and creation date
3. WHEN an administrator runs the CLI delete-user command THEN the system SHALL remove the specified user account and all associated sessions
4. WHEN the CLI tool encounters a database error THEN it SHALL display a clear error message and exit gracefully
5. WHEN the CLI tool is run without proper database connection THEN it SHALL display connection error and exit

### Requirement 3

**User Story:** As a logged-in user, I want to see my authentication status in the UI, so that I know I'm logged in and can access logout functionality.

#### Acceptance Criteria

1. WHEN a user is logged in THEN the system SHALL display a user avatar component in the upper right corner showing their email or name
2. WHEN a user clicks the avatar component THEN the system SHALL display a dropdown menu with user information and logout option
3. WHEN a user clicks logout THEN the system SHALL call BetterAuth signOut, end their session, and redirect to the login page
4. WHEN a user is not logged in THEN the system SHALL not display the avatar component
5. WHEN a user's session is invalid or expired THEN the avatar component SHALL not be displayed

### Requirement 4

**User Story:** As a developer, I want BetterAuth integrated with our existing Prisma database, so that user data is stored consistently with our current data architecture.

#### Acceptance Criteria

1. WHEN the system initializes THEN BetterAuth SHALL use the existing Prisma database connection with proper adapter configuration
2. WHEN a user registers THEN their data SHALL be stored in BetterAuth-managed tables (user, session, account) via Prisma
3. WHEN the database schema is updated THEN it SHALL include BetterAuth required tables: user (with email, name, image fields), session, account, and verification
4. WHEN the application starts THEN BetterAuth SHALL be properly configured with Prisma adapter and database URL
5. WHEN BetterAuth creates database records THEN they SHALL follow our existing UUID primary key pattern

### Requirement 5

**User Story:** As a developer, I want authentication routes integrated with TanStack Start, so that the auth system works seamlessly with our existing routing architecture.

#### Acceptance Criteria

1. WHEN the application loads THEN BetterAuth API routes SHALL be available at /api/auth/* endpoints with sign-up disabled
2. WHEN a user accesses protected routes while unauthenticated THEN the system SHALL redirect them to the login page using TanStack Router
3. WHEN authentication state changes THEN the client SHALL update using BetterAuth's useSession hook
4. WHEN the server starts THEN BetterAuth handler SHALL be properly integrated with TanStack Start's API routes
5. WHEN CSRF protection is enabled THEN requests SHALL be validated against trusted origins including our application domain
6. WHEN BetterAuth is configured THEN sign-up SHALL be disabled to prevent web-based user registration
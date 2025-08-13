#!/usr/bin/env tsx

import "dotenv/config";
import { auth } from "../src/lib/auth";
import prisma from "../src/lib/prisma";

class UserManager {
  async addUser(email: string, password: string, name?: string): Promise<void> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      // Validate password length
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }

      // Use better-auth's built-in signup functionality
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name || email.split("@")[0], // Use email prefix as default name
        },
      });

      if (!result) {
        console.error(result);
        throw new Error("Failed to create user");
      }

      console.log(`✅ User created successfully:`);
      console.log(`   Email: ${result.user.email}`);
      console.log(`   Name: ${result.user.name}`);
      console.log(`   ID: ${result.user.id}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error creating user: ${error.message}`);
      } else {
        console.error("❌ Unknown error occurred while creating user");
      }
      process.exit(1);
    }
  }

  async listUsers(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });

      if (users.length === 0) {
        console.log("📭 No users found");
        return;
      }

      console.log(`👥 Found ${users.length} user(s):\n`);

      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email Verified: ${user.emailVerified ? "✅" : "❌"}`);
        console.log(`   Active Sessions: ${user._count.sessions}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Updated: ${user.updatedAt.toISOString()}`);
        console.log("");
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error listing users: ${error.message}`);
      } else {
        console.error("❌ Unknown error occurred while listing users");
      }
      process.exit(1);
    }
  }

  async deleteUser(email: string): Promise<void> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          sessions: true,
          accounts: true,
        },
      });

      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }

      // Delete user and related data (cascade will handle sessions and accounts)
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log(`✅ User deleted successfully:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Sessions deleted: ${user.sessions.length}`);
      console.log(`   Accounts deleted: ${user.accounts.length}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error deleting user: ${error.message}`);
      } else {
        console.error("❌ Unknown error occurred while deleting user");
      }
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

async function main() {
  const userManager = new UserManager();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🔧 Neural Kitchen User Management CLI\n");
    console.log("Usage:");
    console.log("  pnpm user:add <email> <password> [name]    - Add a new user");
    console.log("  pnpm user:list                             - List all users");
    console.log("  pnpm user:delete <email>                   - Delete a user");
    console.log("\nExamples:");
    console.log("  pnpm user:add admin@example.com mypassword123 'Admin User'");
    console.log("  pnpm user:list");
    console.log("  pnpm user:delete admin@example.com");
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case "add":
        if (args.length < 3) {
          console.error("❌ Usage: pnpm user:add <email> <password> [name]");
          process.exit(1);
        }
        await userManager.addUser(args[1], args[2], args[3]);
        break;

      case "list":
        await userManager.listUsers();
        break;

      case "delete":
        if (args.length < 2) {
          console.error("❌ Usage: pnpm user:delete <email>");
          process.exit(1);
        }
        await userManager.deleteUser(args[1]);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log("Available commands: add, list, delete");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Command failed:", error);
    process.exit(1);
  } finally {
    await userManager.disconnect();
  }
}

// Handle process termination gracefully
process.on("SIGINT", async () => {
  console.log("\n👋 Goodbye!");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Run the CLI
main().catch(async (error) => {
  console.error("💥 Fatal error:", error);
  await prisma.$disconnect();
  process.exit(1);
});

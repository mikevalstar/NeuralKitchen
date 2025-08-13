import { auth } from "../auth";
import {
  type UserCreateInput,
  type UserNameUpdateInput,
  userCreateSchema,
  userNameUpdateSchema,
} from "../dataValidators";
import prisma from "../prisma";

export namespace Users {
  /**
   * Get all users, ordered by creation date (newest first)
   */
  export async function list() {
    return prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get current user by ID
   */
  export async function getCurrentUser(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  /**
   * Create a new user
   */
  export async function create(data: UserCreateInput) {
    const validatedData = userCreateSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new Error(`User with email ${validatedData.email} already exists`);
    }

    // Use better-auth's built-in signup functionality
    const result = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name || validatedData.email.split("@")[0],
      },
    });

    if (!result) {
      throw new Error("Failed to create user");
    }

    return result.user;
  }

  /**
   * Update current user's name
   */
  export async function updateName(userId: string, data: UserNameUpdateInput) {
    const validatedData = userNameUpdateSchema.parse(data);

    const existingUser = await getCurrentUser(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name.trim(),
        updatedAt: new Date(),
      },
    });
  }
}

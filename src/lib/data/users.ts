import { type UserNameUpdateInput, userNameUpdateSchema } from "../dataValidators";
import prisma from "../prisma";

export namespace Users {
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

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

// Export commonly used methods for convenience
export const { signIn, signOut, useSession, getSession, changePassword, admin } = authClient;

import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { getSession } from "./auth-client";
import { Users } from "./data/users";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { data: session } = await getSession({ fetchOptions: { headers: getHeaders() as HeadersInit } });
  const user = session?.user?.id ? await Users.getCurrentUser(session.user.id) : null;

  return await next({
    context: {
      user: {
        id: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name,
        role: user?.role,
      },
    },
  });
});

export const authMiddlewareEnsure = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { data: session } = await getSession({ fetchOptions: { headers: getHeaders() as HeadersInit } });

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const user = await Users.getCurrentUser(session.user.id);

  return await next({
    context: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: user?.role,
      },
    },
  });
});

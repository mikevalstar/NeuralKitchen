import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { getSession } from "./auth-client";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { data: session } = await getSession({ fetchOptions: { headers: getHeaders() as HeadersInit } });

  return await next({
    context: {
      user: {
        id: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name,
      },
    },
  });
});

export const authMiddlewareEnsure = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { data: session } = await getSession({ fetchOptions: { headers: getHeaders() as HeadersInit } });

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  return await next({
    context: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    },
  });
});

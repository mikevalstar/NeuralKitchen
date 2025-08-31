import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { getSession } from "./auth-client";
import { logger } from "./logger.js";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const rawHeaders = getHeaders();
  const headers = new Headers(rawHeaders as HeadersInit);
  const { data: session } = await getSession({ fetchOptions: { headers: rawHeaders as HeadersInit } });

  // Log authentication context with safe header access
  const userAgent = headers.get("user-agent") || "unknown";
  const requestUrl = headers.get("request-url") || "unknown";

  if (session?.user?.id) {
    logger.auth.debug(
      {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        userAgent,
      },
      "User authenticated",
    );
  } else {
    logger.auth.debug(
      {
        userAgent,
        url: requestUrl,
      },
      "Anonymous request",
    );
  }

  return await next({
    context: {
      user: {
        id: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name,
        role: session?.user?.role,
      },
    },
  });
});

export const authMiddlewareEnsure = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const rawHeaders = getHeaders();
  const headers = new Headers(rawHeaders as HeadersInit);
  const { data: session } = await getSession({ fetchOptions: { headers: rawHeaders as HeadersInit } });

  // Safe header access
  const userAgent = headers.get("user-agent") || "unknown";
  const requestUrl = headers.get("request-url") || "unknown";
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const ip = forwardedFor || realIp || "unknown";

  if (!session?.user?.id) {
    logger.auth.warn(
      {
        userAgent,
        url: requestUrl,
        ip,
      },
      "Authentication required but user not authenticated",
    );
    throw new Error("User not authenticated");
  }

  logger.auth.debug(
    {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      userAgent,
    },
    "User authentication enforced",
  );

  return await next({
    context: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    },
  });
});

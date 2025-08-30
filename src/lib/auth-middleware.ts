import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { getSession } from "./auth-client";
import { logger } from "./logger.js";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const headers = getHeaders();
  const { data: session } = await getSession({ fetchOptions: { headers: headers as HeadersInit } });

  // Log authentication context with safe header access
  const userAgent = headers && typeof headers.get === "function" ? headers.get("user-agent") : "unknown";
  const requestUrl = headers && typeof headers.get === "function" ? headers.get("request-url") : "unknown";

  if (session?.user?.id) {
    logger.auth.debug("User authenticated", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      userAgent,
    });
  } else {
    logger.auth.debug("Anonymous request", {
      userAgent,
      url: requestUrl,
    });
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
  const headers = getHeaders();
  const { data: session } = await getSession({ fetchOptions: { headers: headers as HeadersInit } });

  // Safe header access
  const userAgent = headers && typeof headers.get === "function" ? headers.get("user-agent") : "unknown";
  const requestUrl = headers && typeof headers.get === "function" ? headers.get("request-url") : "unknown";
  const forwardedFor = headers && typeof headers.get === "function" ? headers.get("x-forwarded-for") : null;
  const realIp = headers && typeof headers.get === "function" ? headers.get("x-real-ip") : null;
  const ip = forwardedFor || realIp || "unknown";

  if (!session?.user?.id) {
    logger.auth.warn("Authentication required but user not authenticated", {
      userAgent,
      url: requestUrl,
      ip,
    });
    throw new Error("User not authenticated");
  }

  logger.auth.debug("User authentication enforced", {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
    userAgent,
  });

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

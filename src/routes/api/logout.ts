import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";
import { logger } from "~/lib/logger.js";

export const ServerRoute = createServerFileRoute("/api/logout").methods({
  GET: async ({ request }) => {
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    logger.auth.info(
      {
        userAgent,
        ip,
        method: "GET",
      },
      "Logout request initiated (GET)",
    );

    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      logger.auth.info(
        {
          userAgent,
          ip,
          redirectTo: "/login",
        },
        "Logout successful (GET)",
      );

      // Redirect to login page after successful logout
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.auth.error(
        {
          userAgent,
          ip,
          error: errorMessage,
        },
        "Logout error (GET)",
      );
      console.error("Logout error:", error);
      // Even if there's an error, redirect to login page
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    }
  },
  POST: async ({ request }) => {
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    logger.auth.info(
      {
        userAgent,
        ip,
        method: "POST",
      },
      "Logout request initiated (POST)",
    );

    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      logger.auth.info(
        {
          userAgent,
          ip,
        },
        "Logout successful (POST)",
      );

      // Return JSON response for POST requests
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.auth.error(
        {
          userAgent,
          ip,
          error: errorMessage,
        },
        "Logout error (POST)",
      );
      console.error("Logout error:", error);
      return new Response(JSON.stringify({ success: false, error: "Logout failed" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
});

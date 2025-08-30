import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";
import { logger } from "~/lib/logger.js";

export const ServerRoute = createServerFileRoute("/api/logout").methods({
  GET: async ({ request }) => {
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    logger.auth.info("Logout request initiated (GET)", {
      userAgent,
      ip,
      method: "GET",
    });

    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      logger.auth.info("Logout successful (GET)", {
        userAgent,
        ip,
        redirectTo: "/login",
      });

      // Redirect to login page after successful logout
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.auth.error("Logout error (GET)", {
        userAgent,
        ip,
        error: errorMessage,
      });
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

    logger.auth.info("Logout request initiated (POST)", {
      userAgent,
      ip,
      method: "POST",
    });

    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      logger.auth.info("Logout successful (POST)", {
        userAgent,
        ip,
      });

      // Return JSON response for POST requests
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.auth.error("Logout error (POST)", {
        userAgent,
        ip,
        error: errorMessage,
      });
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

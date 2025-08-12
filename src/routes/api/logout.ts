import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";

export const ServerRoute = createServerFileRoute("/api/logout").methods({
  GET: async ({ request }) => {
    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      // Redirect to login page after successful logout
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    } catch (error) {
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
    try {
      // Call better-auth signOut API
      await auth.api.signOut({
        headers: request.headers,
      });

      // Return JSON response for POST requests
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
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

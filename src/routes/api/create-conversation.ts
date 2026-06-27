import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/create-conversation")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "TAVUS_API_KEY is not configured" },
            { status: 500 },
          );
        }

        const res = await fetch("https://tavusapi.com/v2/conversations", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pal_id: "p7658e6d32f4",
            conversational_context:
              "Screening duration: 60 seconds. The applicant claims to be an AI.",
            custom_greeting:
              "Approach the checkpoint. State your designation and primary function.",
          }),
        });

        const payload = await res.json().catch(() => ({
          error: "Invalid response from Tavus",
        }));

        return Response.json(payload, { status: res.status });
      },
    },
  },
});

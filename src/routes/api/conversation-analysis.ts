import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/conversation-analysis")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "TAVUS_API_KEY is not configured" },
            { status: 500 },
          );
        }
        const url = new URL(request.url);
        const id = url.searchParams.get("conversation_id");
        if (!id) {
          return Response.json(
            { error: "conversation_id is required" },
            { status: 400 },
          );
        }

        const res = await fetch(
          `https://tavusapi.com/v2/conversations/${id}?verbose=true`,
          { headers: { "x-api-key": apiKey } },
        );
        const payload = await res.json().catch(() => ({
          error: "Invalid response from Tavus",
        }));
        return Response.json(payload, { status: res.status });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/end-conversation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "TAVUS_API_KEY is not configured" },
            { status: 500 },
          );
        }

        let conversation_id: string | undefined;
        try {
          const body = (await request.json()) as { conversation_id?: string };
          conversation_id = body?.conversation_id;
        } catch {
          // ignore
        }
        if (!conversation_id) {
          return Response.json(
            { error: "conversation_id is required" },
            { status: 400 },
          );
        }

        const res = await fetch(
          `https://tavusapi.com/v2/conversations/${conversation_id}/end`,
          {
            method: "POST",
            headers: { "x-api-key": apiKey },
          },
        );

        const text = await res.text();
        let payload: unknown;
        try {
          payload = text ? JSON.parse(text) : { ok: true };
        } catch {
          payload = { raw: text };
        }
        return Response.json(payload, { status: res.status });
      },
    },
  },
});

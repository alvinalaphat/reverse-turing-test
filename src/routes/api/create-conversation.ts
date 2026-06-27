import { createFileRoute } from "@tanstack/react-router";

async function createTavusConversation(apiKey: string, origin: string) {
  return fetch("https://tavusapi.com/v2/conversations", {
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
        "It's time to see whether you're human or AI. Introduce yourself.",
      callback_url: `${origin}/api/public/tavus-webhook`,
      properties: {
        enable_transcription: true,
        enable_closed_captions: true,
        enable_perception_analysis: true,
      },
    }),
  });
}

async function endAllActiveConversations(apiKey: string) {
  const listRes = await fetch(
    "https://tavusapi.com/v2/conversations?status=active",
    { headers: { "x-api-key": apiKey } },
  );
  if (!listRes.ok) return;
  const list = await listRes.json().catch(() => null) as
    | { data?: Array<{ conversation_id: string }> }
    | null;
  const items = list?.data ?? [];
  await Promise.all(
    items.map((c) =>
      fetch(`https://tavusapi.com/v2/conversations/${c.conversation_id}/end`, {
        method: "POST",
        headers: { "x-api-key": apiKey },
      }).catch(() => null),
    ),
  );
}

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

        let res = await createTavusConversation(apiKey);

        // Tavus caps concurrent conversations per account. If we hit the
        // limit, end any leftover active sessions and retry once.
        if (!res.ok) {
          const text = await res.clone().text();
          if (/maximum concurrent/i.test(text)) {
            await endAllActiveConversations(apiKey);
            res = await createTavusConversation(apiKey);
          }
        }

        const payload = await res.json().catch(() => ({
          error: "Invalid response from Tavus",
        }));

        return Response.json(payload, { status: res.status });
      },
    },
  },
});

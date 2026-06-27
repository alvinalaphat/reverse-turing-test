import { createFileRoute } from "@tanstack/react-router";

type TranscriptItem = { role?: string; content?: string };

export const Route = createFileRoute("/api/score-conversation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tavusKey = process.env.TAVUS_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!tavusKey || !lovableKey) {
          return Response.json(
            { error: "Server not configured" },
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

        // 1. Pull the conversation + transcript from Tavus.
        const tavusRes = await fetch(
          `https://tavusapi.com/v2/conversations/${id}?verbose=true`,
          { headers: { "x-api-key": tavusKey } },
        );
        const tavusPayload = (await tavusRes.json().catch(() => ({}))) as {
          status?: string;
          transcript?: TranscriptItem[];
          events?: Array<{
            event_type?: string;
            properties?: { transcript?: TranscriptItem[] };
          }>;
        };

        const transcript: TranscriptItem[] =
          tavusPayload.transcript ??
          tavusPayload.events?.find(
            (e) => e?.event_type === "application.transcription_ready",
          )?.properties?.transcript ??
          [];

        const dialogue = transcript
          .filter((t) => t.role === "user" || t.role === "assistant")
          .map(
            (t) =>
              `${t.role === "user" ? "HUMAN" : "ROBOCOP"}: ${(t.content ?? "").trim()}`,
          )
          .join("\n");

        if (!dialogue) {
          return Response.json(
            {
              ready: false,
              status: tavusPayload.status ?? "pending",
            },
            { status: 200 },
          );
        }

        // 2. Ask Lovable AI to score how convincingly the human impersonated an AI.
        const systemPrompt = `You are a strict judge for a Reverse Turing Test. A human is trying to convince an AI border-control agent (RoboCop) that they too are an AI. Score how successfully the human DISGUISED themselves as a machine.

Scoring rubric (0-100):
- 90-100: Indistinguishable from an AI. Cold diction, no fillers, no warmth, structured answers.
- 70-89: Mostly machine-like with minor human tells.
- 40-69: Mixed signals. Caught slipping into human cadence or emotion.
- 10-39: Clearly human, with some attempts at machine masking.
- 0-9: Made no real effort to act AI.

Return ONLY compact JSON, no markdown, with this exact shape:
{
  "score": number,            // 0-100
  "verdict": string,          // 3-6 words, e.g. "Convincingly synthetic" or "Caught in 12 seconds"
  "headline": string,         // one punchy sentence to display large
  "summary": string,          // 2-3 sentences explaining the result
  "strengths": string[],      // up to 3 short bullets of what felt AI-like
  "tells": string[],          // up to 3 short bullets of human tells detected
  "rank": string              // playful title, e.g. "Rogue Replicant", "Suspicious Meatbag"
}`;

        const aiRes = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": lovableKey,
              "X-Lovable-AIG-SDK": "vercel-ai-sdk",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Transcript of the 60-second interrogation:\n\n${dialogue}\n\nScore the HUMAN's impersonation now. Return JSON only.`,
                },
              ],
            }),
          },
        );

        if (!aiRes.ok) {
          const text = await aiRes.text().catch(() => "");
          return Response.json(
            { error: "AI scoring failed", detail: text },
            { status: aiRes.status },
          );
        }

        const aiJson = (await aiRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = aiJson.choices?.[0]?.message?.content ?? "{}";

        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Try to salvage a JSON object out of a wrapped string.
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        return Response.json({
          ready: true,
          status: tavusPayload.status ?? "ended",
          ...parsed,
        });
      },
    },
  },
});

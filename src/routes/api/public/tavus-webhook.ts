import { createFileRoute } from "@tanstack/react-router";

// Tavus posts conversation lifecycle + analysis events here.
// Event types we care about:
//   - application.perception_analysis  (the human-vs-AI verdict)
//   - application.transcription_ready  (full transcript)
//   - system.shutdown                  (call ended)
//
// Workers are stateless so we just log here. The /call screen reads the
// final analysis by polling Tavus REST via /api/conversation-analysis.
export const Route = createFileRoute("/api/public/tavus-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json().catch(() => null);
          // eslint-disable-next-line no-console
          console.log("[tavus-webhook]", JSON.stringify(payload));
        } catch {
          // ignore
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});

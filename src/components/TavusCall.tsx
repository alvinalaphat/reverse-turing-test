import { useEffect, useRef } from "react";

export type TranscriptLine = { who: "ai" | "you"; text: string; id: string };

/**
 * Embed the Tavus hosted CVI page directly via iframe so persona-level
 * features (Magic Canvas, tool-call overlays, perception UI) render as
 * configured in the Tavus console. We still capture transcript utterances
 * by listening for postMessage events the hosted page forwards.
 */
export function TavusCall({
  url,
  onTranscript,
  onAiSpeakingChange,
}: {
  url: string;
  onTranscript: (line: TranscriptLine) => void;
  onAiSpeakingChange?: (speaking: boolean) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const data = ev?.data as
        | {
            event_type?: string;
            message_type?: string;
            properties?: { role?: string; speech?: string; text?: string };
          }
        | undefined;
      if (!data || typeof data !== "object") return;

      const type = data.event_type ?? data.message_type ?? "";
      if (
        type === "conversation.utterance" ||
        type === "conversation.user.utterance" ||
        type === "conversation.replica.utterance" ||
        type === "conversation.transcription_ready"
      ) {
        const role = data.properties?.role ?? "";
        const text = data.properties?.speech ?? data.properties?.text ?? "";
        if (!text) return;
        const who: "ai" | "you" =
          role.includes("user") || role === "human" ? "you" : "ai";
        onTranscript({ who, text, id: `${Date.now()}-${Math.random()}` });
      }

      if (type === "conversation.replica.started_speaking") {
        onAiSpeakingChange?.(true);
      }
      if (type === "conversation.replica.stopped_speaking") {
        onAiSpeakingChange?.(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onTranscript, onAiSpeakingChange]);

  // Build URL with layout/UI prefs Tavus's hosted page understands.
  const src = (() => {
    try {
      const u = new URL(url);
      u.searchParams.set("layout", "grid");
      return u.toString();
    } catch {
      return url;
    }
  })();

  return (
    <iframe
      ref={iframeRef}
      src={src}
      allow="camera; microphone; autoplay; display-capture; fullscreen"
      className="absolute inset-0 h-full w-full border-0"
      title="Tavus conversation"
    />
  );
}

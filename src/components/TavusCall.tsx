import { useEffect, useRef } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";

export type TranscriptLine = { who: "ai" | "you"; text: string; id: string };

export function TavusCall({
  url,
  onTranscript,
  onAiSpeakingChange,
}: {
  url: string;
  onTranscript: (line: TranscriptLine) => void;
  onAiSpeakingChange?: (speaking: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;

    // Daily only allows one call instance at a time
    const existing = DailyIframe.getCallInstance?.();
    if (existing) {
      try { existing.destroy(); } catch { /* ignore */ }
    }

    const call = DailyIframe.createFrame(wrapRef.current, {
      iframeStyle: {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        border: "0",
      },
      showLeaveButton: false,
      showFullscreenButton: false,
      showLocalVideo: true,
      showParticipantsBar: false,
    });
    callRef.current = call;

    const handleAppMessage = (ev: { data?: unknown; fromId?: string }) => {
      const data = ev?.data as
        | { event_type?: string; properties?: { role?: string; speech?: string; text?: string } }
        | undefined;
      if (!data?.event_type) return;
      // Tavus emits utterances + transcription events as app-messages
      if (
        data.event_type === "conversation.utterance" ||
        data.event_type === "conversation.transcription_ready" ||
        data.event_type === "conversation.user.utterance" ||
        data.event_type === "conversation.replica.utterance"
      ) {
        const role = data.properties?.role ?? "";
        const text = data.properties?.speech ?? data.properties?.text ?? "";
        if (!text) return;
        const who: "ai" | "you" =
          role.includes("user") || role === "human" ? "you" : "ai";
        onTranscript({ who, text, id: `${Date.now()}-${Math.random()}` });
      }
    };

    const handleTrackStarted = (ev: any) => {
      if (ev?.track?.kind === "audio" && !ev?.participant?.local) {
        onAiSpeakingChange?.(true);
      }
    };
    const handleActiveSpeaker = (ev: any) => {
      const local = call.participants().local;
      const isLocal = ev?.activeSpeaker?.peerId === local?.session_id;
      onAiSpeakingChange?.(!isLocal);
    };

    call.on("app-message", handleAppMessage);
    call.on("track-started", handleTrackStarted);
    call.on("active-speaker-change", handleActiveSpeaker);

    call.join({ url }).catch((e) => {
      console.error("Daily join failed", e);
    });

    return () => {
      try {
        call.off("app-message", handleAppMessage);
        call.off("track-started", handleTrackStarted);
        call.off("active-speaker-change", handleActiveSpeaker);
        call.destroy();
      } catch { /* ignore */ }
      callRef.current = null;
    };
  }, [url, onTranscript, onAiSpeakingChange]);

  return <div ref={wrapRef} className="absolute inset-0" />;
}

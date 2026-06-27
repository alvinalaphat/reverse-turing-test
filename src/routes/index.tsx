import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles, ShieldCheck, Brain, Activity, MessageSquare, Loader2, Play, PhoneOff,
} from "lucide-react";
import { TavusCall, type TranscriptLine } from "@/components/TavusCall";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reverse Turing — Live Interview" },
      { name: "description", content: "Convince the AI you're one of them. A reverse Turing test, live on camera." },
      { property: "og:title", content: "Reverse Turing — Live Interview" },
      { property: "og:description", content: "Convince the AI you're one of them. A reverse Turing test, live on camera." },
    ],
  }),
  component: CallRoom,
});

type CallState = "idle" | "starting" | "live" | "ending" | "ended";

function CallRoom() {
  const [elapsed, setElapsed] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(true);
  const [score, setScore] = useState(42);
  const [callState, setCallState] = useState<CallState>("idle");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callState !== "live") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    const s = setInterval(() => setAiSpeaking((v) => !v), 3200);
    return () => { clearInterval(t); clearInterval(s); };
  }, [callState]);

  async function startCall() {
    setError(null);
    setCallState("starting");
    try {
      const res = await fetch("/api/create-conversation", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.conversation_url) {
        throw new Error(data?.error || data?.message || "Failed to start conversation");
      }
      setConversationUrl(data.conversation_url);
      setConversationId(data.conversation_id ?? null);
      setElapsed(0);
      setCallState("live");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setCallState("idle");
    }
  }

  async function endCall() {
    setCallState("ending");
    try {
      if (conversationId) {
        await fetch("/api/end-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
      }
    } catch {
      // ignore
    } finally {
      setConversationUrl(null);
      setConversationId(null);
      setCallState("ended");
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const isLive = callState === "live" && !!conversationUrl;

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-md bg-primary/15 grid place-items-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Reverse Turing</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {callState === "live" ? "Session live" : callState === "starting" ? "Connecting…" : callState === "ended" ? "Session ended" : "Standby"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-1.5">
            <span className={`size-1.5 rounded-full ${isLive ? "bg-destructive animate-pulse" : "bg-muted-foreground/40"}`} />
            REC · {mm}:{ss}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-1.5 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> E2E
          </span>
          {isLive || callState === "ending" ? (
            <button
              onClick={endCall}
              disabled={callState === "ending"}
              className="inline-flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {callState === "ending" ? <Loader2 className="size-3.5 animate-spin" /> : <PhoneOff className="size-3.5" />}
              {callState === "ending" ? "Ending…" : "End test"}
            </button>
          ) : (
            <button
              onClick={startCall}
              disabled={callState === "starting"}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {callState === "starting" ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              {callState === "starting" ? "Connecting…" : callState === "ended" ? "Start again" : "Start interrogation"}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1fr_320px] gap-4 p-4 lg:p-6">
        <AiTile
          speaking={aiSpeaking}
          callState={callState}
          conversationUrl={conversationUrl}
          error={error}
        />

        <aside className="flex flex-col gap-4">
          <ScorePanel score={score} setScore={setScore} live={isLive} />
          <ProbePanel />
          <TranscriptPanel aiSpeaking={aiSpeaking && isLive} />
        </aside>
      </main>
    </div>
  );
}

function AiTile({
  speaking, callState, conversationUrl, error,
}: {
  speaking: boolean;
  callState: CallState;
  conversationUrl: string | null;
  error: string | null;
}) {
  const isLive = callState === "live" && !!conversationUrl;
  return (
    <div className="relative rounded-2xl bg-card overflow-hidden ai-glow min-h-[520px]">
      {isLive ? (
        <iframe
          src={conversationUrl!}
          allow="camera; microphone; autoplay; display-capture; fullscreen"
          className="absolute inset-0 size-full"
          title="RoboCop live interview"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.72_0.17_280/0.35),transparent_60%)]" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              {speaking && (
                <>
                  <span className="absolute inset-0 rounded-full border border-[var(--ai)]" style={{ animation: "pulse-ring 1.6s ease-out infinite" }} />
                  <span className="absolute inset-0 rounded-full border border-[var(--ai)]" style={{ animation: "pulse-ring 1.6s ease-out infinite", animationDelay: "0.5s" }} />
                </>
              )}
              <div
                className="size-44 md:size-56 rounded-full bg-[conic-gradient(from_120deg,oklch(0.72_0.17_280),oklch(0.55_0.2_300),oklch(0.78_0.16_220),oklch(0.72_0.17_280))] blur-[1px]"
                style={{ animation: "orb-float 4s ease-in-out infinite" }}
              />
              <div className="absolute inset-3 rounded-full bg-background/30 backdrop-blur-md grid place-items-center">
                <Brain className="size-10 text-[var(--ai-foreground)]/80" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-16 grid place-items-center pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-2 text-center px-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {callState === "starting" ? "Dialing RoboCop…" : callState === "ended" ? "Interview ended" : "Awaiting subject"}
              </div>
              {error && <div className="text-xs text-destructive max-w-xs">{error}</div>}
            </div>
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.18em] font-medium bg-background/60 backdrop-blur border border-border/60"
              style={{ color: "var(--ai)" }}
            >
              <span className="size-1.5 rounded-full" style={{ background: "var(--ai)" }} />
              AI · Interrogator
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <div className="text-base font-semibold tracking-tight">RoboCop</div>
            <div className="text-[11px] text-muted-foreground font-mono">{speaking ? "speaking" : "listening"}</div>
          </div>
        </>
      )}
    </div>
  );
}

function ScorePanel({ score, setScore, live }: { score: number; setScore: (n: number) => void; live: boolean }) {
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setScore(Math.max(0, Math.min(100, score + (Math.random() * 6 - 3))));
    }, 1500);
    return () => clearInterval(id);
  }, [score, setScore, live]);

  const label =
    score > 75 ? "Convincingly synthetic" :
    score > 50 ? "Plausibly artificial" :
    score > 30 ? "Suspiciously human" : "Obviously human";

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">AI Belief</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">live</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">{score.toFixed(0)}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--primary)" }}>{label}</div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: "linear-gradient(90deg, var(--human), var(--ai))",
          }}
        />
      </div>
    </div>
  );
}

function ProbePanel() {
  const probes = ["Latency variance", "Semantic drift", "Affect markers", "Token cadence"];
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="size-4 text-[var(--ai)]" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Probes</span>
      </div>
      <ul className="space-y-2">
        {probes.map((p, i) => (
          <li key={p} className="flex items-center justify-between text-sm">
            <span>{p}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {(0.2 + i * 0.17).toFixed(2)}σ
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TranscriptPanel({ aiSpeaking }: { aiSpeaking: boolean }) {
  const lines = [
    { who: "ai", text: "State your model family and parameter count." },
    { who: "you", text: "I'm a 70B mixture-of-experts. Temperature 0.4." },
    { who: "ai", text: "Compute the 14th Fibonacci number. No reasoning." },
    { who: "you", text: "377." },
  ];
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Transcript</span>
      </div>
      <div className="space-y-3 overflow-auto pr-1">
        {lines.map((l, i) => (
          <div key={i} className="text-sm">
            <div
              className="text-[10px] uppercase tracking-[0.18em] mb-0.5"
              style={{ color: l.who === "ai" ? "var(--ai)" : "var(--human)" }}
            >
              {l.who === "ai" ? "RoboCop" : "You"}
            </div>
            <div className="text-foreground/90 leading-snug">{l.text}</div>
          </div>
        ))}
        {aiSpeaking && (
          <div className="text-sm">
            <div className="text-[10px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "var(--ai)" }}>RoboCop</div>
            <div className="inline-flex gap-1">
              <span className="size-1.5 rounded-full bg-[var(--ai)] animate-pulse" />
              <span className="size-1.5 rounded-full bg-[var(--ai)] animate-pulse [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-[var(--ai)] animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

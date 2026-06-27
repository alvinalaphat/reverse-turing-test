import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Brain, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/results/$conversationId")({
  head: () => ({
    meta: [
      { title: "Reverse Turing — Verdict" },
      { name: "description", content: "Your reverse Turing test verdict." },
    ],
  }),
  component: ResultsPage,
});

type AnalysisPayload = {
  status?: string;
  conversation_name?: string;
  events?: Array<{
    event_type?: string;
    properties?: Record<string, unknown>;
    created_at?: string;
  }>;
  perception_analysis?: unknown;
  // Tavus returns nested shapes; we render whatever we get.
  [key: string]: unknown;
};

function ResultsPage() {
  const { conversationId } = Route.useParams();
  const [data, setData] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/conversation-analysis?conversation_id=${encodeURIComponent(conversationId)}`,
        );
        const json = (await res.json()) as AnalysisPayload;
        if (cancelled) return;
        setData(json);
        setAttempts((n) => n + 1);

        const analysis = extractAnalysis(json);
        const done =
          analysis !== null || json.status === "ended" && attempts > 6;
        if (!done) {
          timerRef.current = window.setTimeout(poll, 4000);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load analysis");
        timerRef.current = window.setTimeout(poll, 6000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const analysis = data ? extractAnalysis(data) : null;

  return (
    <div className="min-h-screen grid-bg">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-md bg-primary/15 grid place-items-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Reverse Turing</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Verdict
            </div>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-1.5 text-xs hover:bg-secondary transition"
        >
          <ArrowLeft className="size-3.5" /> Home
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Conversation
          </div>
          <div className="font-mono text-sm text-foreground/80 break-all">
            {conversationId}
          </div>
        </div>

        {!analysis && !error && (
          <div className="rounded-2xl bg-card border border-border/60 p-8 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Waiting for RoboCop to finalize the analysis…
            <span className="ml-auto font-mono text-[11px]">attempt {attempts}</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-card border border-destructive/40 p-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {analysis && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4 ai-glow">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-[var(--ai)]" />
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Perception analysis
              </span>
            </div>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground/90 font-mono max-h-[480px] overflow-auto">
              {JSON.stringify(analysis, null, 2) as string}
            </pre>
          </div>
        )}

        {data && (
          <details className="rounded-2xl bg-card border border-border/60 p-4 text-xs">
            <summary className="cursor-pointer text-muted-foreground uppercase tracking-[0.18em]">
              Raw Tavus payload
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-foreground/70 max-h-[320px] overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}

// Tavus returns the analysis in different shapes across versions. Look in a
// few likely places and return whichever one is populated.
function extractAnalysis(payload: AnalysisPayload): unknown | null {
  if (payload.perception_analysis) return payload.perception_analysis;
  const events = Array.isArray(payload.events) ? payload.events : [];
  const evt = events.find(
    (e) =>
      e?.event_type === "application.perception_analysis" ||
      e?.event_type === "application.transcription_ready",
  );
  if (evt?.properties) return evt.properties;
  return null;
}

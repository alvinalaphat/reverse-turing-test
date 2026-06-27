import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Trophy,
  Share2,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/results/$conversationId")({
  head: () => ({
    meta: [
      { title: "Reverse Turing — Your Verdict" },
      {
        name: "description",
        content:
          "See how convincingly you impersonated an AI. Share your score and challenge others to fight deepfakes.",
      },
    ],
  }),
  component: ResultsPage,
});

type Score = {
  ready?: boolean;
  status?: string;
  score?: number;
  verdict?: string;
  headline?: string;
  summary?: string;
  strengths?: string[];
  tells?: string[];
  rank?: string;
};

function ResultsPage() {
  const { conversationId } = Route.useParams();
  const [data, setData] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/score-conversation?conversation_id=${encodeURIComponent(conversationId)}`,
        );
        const json = (await res.json()) as Score;
        if (cancelled) return;
        setAttempts((n) => n + 1);
        if (json.ready && typeof json.score === "number") {
          setData(json);
          return;
        }
        timerRef.current = window.setTimeout(poll, 4000);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load verdict");
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

  const score = Math.round(data?.score ?? 0);
  const shareUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const shareText = data
    ? `I scored ${score}/100 disguising myself as an AI on Reverse Turing — "${data.rank ?? data.verdict ?? "verdict"}". Can you beat me? Help fight deepfakes →`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

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

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        {!data && !error && (
          <div className="rounded-2xl bg-card border border-border/60 p-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-6 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">
              RoboCop is reviewing the tapes…
            </div>
            <div className="font-mono text-[11px] text-muted-foreground/70">
              attempt {attempts}
            </div>
          </div>
        )}

        {error && !data && (
          <div className="rounded-2xl bg-card border border-destructive/40 p-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Hero score card */}
            <div className="rounded-3xl bg-card border border-border/60 p-8 ai-glow text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 border border-border/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                <Trophy className="size-3.5 text-primary" />
                Final verdict
              </div>
              <div className="flex items-end justify-center gap-2 mb-2">
                <span className="text-7xl md:text-8xl font-semibold tracking-tight tabular-nums bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {score}
                </span>
                <span className="text-2xl text-muted-foreground mb-3">/ 100</span>
              </div>
              <div
                className="text-sm uppercase tracking-[0.22em] mb-4"
                style={{ color: "var(--ai)" }}
              >
                {data.rank ?? data.verdict ?? "Verdict"}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${score}%`,
                    background:
                      "linear-gradient(90deg, var(--human), var(--ai))",
                  }}
                />
              </div>
              {data.headline && (
                <p className="mt-6 text-lg font-medium leading-snug">
                  {data.headline}
                </p>
              )}
              {data.summary && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {data.summary}
                </p>
              )}
            </div>

            {/* Strengths + tells */}
            {(data.strengths?.length || data.tells?.length) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.strengths && data.strengths.length > 0 && (
                  <div className="rounded-2xl bg-card border border-border/60 p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                      Machine-like
                    </div>
                    <ul className="space-y-2 text-sm">
                      {data.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span style={{ color: "var(--ai)" }}>›</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.tells && data.tells.length > 0 && (
                  <div className="rounded-2xl bg-card border border-border/60 p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                      Human tells
                    </div>
                    <ul className="space-y-2 text-sm">
                      {data.tells.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive">›</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Share */}
            <div className="rounded-2xl bg-card border border-border/60 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="size-4 text-primary" />
                <span className="text-sm font-semibold">
                  Recruit the next undercover agent
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Share your score and challenge a friend. Every test trains better
                deepfake detection in the wild.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/70 transition px-4 py-2 text-sm"
                >
                  <Twitter className="size-3.5" /> Post on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/70 transition px-4 py-2 text-sm"
                >
                  <Linkedin className="size-3.5" /> LinkedIn
                </a>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/70 transition px-4 py-2 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <LinkIcon className="size-3.5" /> Copy link
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                to="/call"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
              >
                <RotateCcw className="size-4" /> Try again
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

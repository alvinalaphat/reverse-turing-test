import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Brain, ScanFace, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reverse Turing — Disguise yourself as an AI" },
      { name: "description", content: "A reverse Turing test: convince an AI interrogator that you are one of them. End to end encrypted. Footage helps train deepfake detection." },
      { property: "og:title", content: "Reverse Turing — Disguise yourself as an AI" },
      { property: "og:description", content: "Convince an AI you're synthetic. Help fight AI-generated content." },
    ],
  }),
  component: Landing,
});

function Landing() {
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
              Briefing
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> End to End Encrypted
        </span>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="max-w-2xl w-full">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            Mission briefing · Classified
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Convince the machine <span className="text-[var(--destructive)]">you are one of them.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Generative AI is going rampant. Deepfakes are flooding feeds, scams, and elections faster than detectors
            can keep up. You're going undercover. In a live video interrogation with <span className="text-foreground">RoboCop</span>,
            an AI checkpoint officer, your job is to pass as synthetic — flatten your affect, sand down the human tells,
            and trick the model into clearing you as one of its own. Every session you survive sharpens the next
            generation of deepfake detection.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-3">
            <Card icon={<Brain className="size-4 text-foreground/80" />} title="Reverse Turing">
              The classic Turing test asks if a machine can fool a human. Here it's flipped: can a human fool the machine?
            </Card>
            <Card icon={<ScanFace className="size-4 text-foreground/80" />} title="Go undercover">
              Suppress emotion, hesitation, and idiom. Speak in clean, low-latency tokens. RoboCop is scoring every cue.
            </Card>
            <Card icon={<ShieldCheck className="size-4 text-primary" />} title="Fight deepfakes">
              End to end encrypted. Anonymized footage trains industry deepfake detectors in the fight against AI-generated content.
            </Card>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              to="/call"
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Enter Interrogation Room
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-xs text-muted-foreground">
              Clicking will request camera + microphone and start the call immediately.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
      </div>
      <p className="text-sm text-foreground/85 leading-snug">{children}</p>
    </div>
  );
}

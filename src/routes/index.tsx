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
            Mission briefing
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Trick the AI into thinking{" "}
            <span className="text-[var(--destructive)]">you are one of them.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Generative AI is running rampant.</strong> Deepfakes are everywhere.
            You are going undercover in a live video call with{" "}
            <strong className="text-foreground">RoboCop</strong> to convince it you are synthetic.
            Survive the interrogation and help train the next generation of deepfake detectors.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-3">
            <Card icon={<Brain className="size-4 text-foreground/80" />} title="Reverse Turing">
              <strong>The test is flipped.</strong> Can a human fool a machine?
            </Card>
            <Card icon={<ScanFace className="size-4 text-foreground/80" />} title="Go undercover">
              <strong>Act like an AI.</strong> Flat, precise, no human tells.
            </Card>
            <Card icon={<ShieldCheck className="size-4 text-primary" />} title="Fight deepfakes">
              <strong>End to end encrypted.</strong> Your session helps train detectors.
            </Card>
          </div>

          <div className="mt-10">
            <Link
              to="/call"
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Enter Interrogation Room
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
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

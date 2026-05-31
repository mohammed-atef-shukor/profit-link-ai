import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { OnboardingStep } from "@/lib/onboarding";

type OnboardingChecklistProps = {
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
  progress: number;
  motivation?: string;
  onDismiss: () => void;
};

export function OnboardingChecklist({
  title,
  subtitle,
  steps,
  progress,
  motivation,
  onDismiss,
}: OnboardingChecklistProps) {
  const next = steps.find((s) => !s.done);

  return (
    <section className="mt-8 rounded-2xl border border-primary/20 bg-surface p-5 sm:p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Getting started</div>
          <h2 className="mt-1 font-display text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss checklist">
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-2" />
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{progress}%</span>
      </div>

      {motivation && (
        <p className="mt-4 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm font-medium text-foreground">
          {motivation}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            {step.href && !step.done ? (
              <Link
                to={step.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
              >
                <StepIcon done={step.done} />
                <span>{step.label}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
                <StepIcon done={step.done} />
                <span className={step.done ? "text-muted-foreground" : ""}>{step.label}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {next?.href && (
        <div className="mt-5">
          <Button asChild size="sm" className="gap-2">
            <Link to={next.href}>Continue: {next.label}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="size-5 shrink-0 text-success" />
  ) : (
    <Circle className="size-5 shrink-0 text-muted-foreground/50" />
  );
}

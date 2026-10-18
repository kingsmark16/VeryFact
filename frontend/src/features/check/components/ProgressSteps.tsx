import { Progress } from "@/components/ui/progress";

const STAGE_PROGRESS: Record<string, { value: number; label: string }> = {
  QUEUED: { value: 10, label: "Queued…" },
  EXTRACTING_CLAIMS: { value: 35, label: "Extracting claims…" },
  SEARCHING_FACT_CHECKS: { value: 55, label: "Searching professional fact-checks…" },
  VERIFYING_CLAIMS: { value: 80, label: "Verifying claims against live web sources…" },
  COMPLETED: { value: 100, label: "Done" },
  FAILED: { value: 100, label: "Failed" },
};

export function ProgressSteps({ stage }: { stage?: string }) {
  const step = STAGE_PROGRESS[stage ?? "QUEUED"] ?? STAGE_PROGRESS.QUEUED;
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <Progress value={step.value} />
      <p className="text-sm text-muted-foreground">{step.label}</p>
    </div>
  );
}

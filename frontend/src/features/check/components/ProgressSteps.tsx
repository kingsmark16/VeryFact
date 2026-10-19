import { Progress } from "@/components/ui/progress";
import { Loader2, Hash, FileSearch, Database, CheckCircle2 } from "lucide-react";

interface StepConfig {
  value: number;
  label: string;
  sublabel: string;
  icon: typeof Hash;
}

const STAGE_PROGRESS: Record<string, StepConfig> = {
  QUEUED: {
    value: 15,
    label: "Queued…",
    sublabel: "Computing SHA-256 hash & checking 7-day cache",
    icon: Hash,
  },
  EXTRACTING_CLAIMS: {
    value: 40,
    label: "Extracting claims…",
    sublabel: "Synthesizing text, URL body, and multimodal screenshots",
    icon: FileSearch,
  },
  SEARCHING_FACT_CHECKS: {
    value: 65,
    label: "Searching professional fact-checks…",
    sublabel: "Querying accredited journalistic databases via Google Fact Check Tools",
    icon: Database,
  },
  VERIFYING_CLAIMS: {
    value: 85,
    label: "Verifying claims against live web sources…",
    sublabel: "Gemini 3.8 Flash performing grounded Google Search analysis",
    icon: Loader2,
  },
  COMPLETED: {
    value: 100,
    label: "Done",
    sublabel: "Verification analysis complete",
    icon: CheckCircle2,
  },
  FAILED: {
    value: 100,
    label: "Failed",
    sublabel: "Analysis interrupted",
    icon: CheckCircle2,
  },
};

const STAGES = [
  { key: "QUEUED", label: "Hashing" },
  { key: "EXTRACTING_CLAIMS", label: "Extraction" },
  { key: "SEARCHING_FACT_CHECKS", label: "Fact Check Tools" },
  { key: "VERIFYING_CLAIMS", label: "Gemini Grounding" },
];

export function ProgressSteps({ stage }: { stage?: string }) {
  const currentKey = stage ?? "QUEUED";
  const step = STAGE_PROGRESS[currentKey] ?? STAGE_PROGRESS.QUEUED;
  const Icon = step.icon;

  const currentStageIndex = STAGES.findIndex((s) => s.key === currentKey);

  return (
    <div
      className="space-y-4 rounded-xl border border-blue-500/20 bg-linear-to-b from-blue-50/50 to-transparent p-5 dark:from-blue-950/20"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
            <Icon className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.sublabel}</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          {step.value}%
        </span>
      </div>

      <Progress value={step.value} className="h-2" />

      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        {STAGES.map((s, idx) => {
          const isActive = idx === currentStageIndex;
          const isDone = idx < currentStageIndex || currentKey === "COMPLETED";

          return (
            <div key={s.key} className="space-y-1">
              <div
                className={`mx-auto h-1.5 w-full rounded-full transition-colors ${
                  isDone
                    ? "bg-blue-600 dark:bg-blue-400"
                    : isActive
                      ? "animate-pulse bg-blue-400 dark:bg-blue-500"
                      : "bg-border"
                }`}
              />
              <span
                className={`text-[11px] font-medium leading-none ${
                  isActive
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : isDone
                      ? "text-foreground"
                      : "text-muted-foreground/60"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

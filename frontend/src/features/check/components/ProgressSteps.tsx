import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, FileText, ScanText, BookOpen, LoaderCircle } from "lucide-react";
import "@/lib/i18n";

const activities = {
  QUEUED: { label: "queued", icon: FileText },
  EXTRACTING_CLAIMS: { label: "extracting", icon: ScanText },
  SEARCHING_FACT_CHECKS: { label: "searching", icon: BookOpen },
  VERIFYING_CLAIMS: { label: "verifying", icon: Search },
  COMPLETED: { label: "done", icon: FileText },
  FAILED: { label: "failed", icon: FileText },
};

export function ProgressSteps({ stage, opening = false }: { stage?: string; opening?: boolean }) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const activity = activities[stage as keyof typeof activities];
  const label = opening ? "opening" : (activity?.label ?? "unknown");
  const Icon = opening ? LoaderCircle : (activity?.icon ?? LoaderCircle);
  return (
    <section
      className={`loading-state ${paused ? "motion-paused" : ""}`}
      aria-labelledby="loading-heading"
    >
      <button
        type="button"
        className="loading-orbit"
        aria-label={t(`loading.${paused ? "resume" : "pause"}`)}
        title={t(`loading.${paused ? "resume" : "pause"}`)}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        <svg viewBox="0 0 200 200" className="orbit-graphic" aria-hidden="true">
          <circle cx="100" cy="100" r="82" className="orbit-guide" />
          <circle cx="100" cy="100" r="62" className="orbit-guide orbit-guide-inner" />
          <g className="orbit-turn">
            <circle cx="100" cy="100" r="82" className="orbit-trail" />
            <circle cx="100" cy="18" r="5" className="orbit-particle" />
          </g>
          <g className="orbit-counterturn">
            <circle cx="100" cy="100" r="62" className="orbit-inner-trail" />
            <circle cx="100" cy="162" r="3" className="orbit-particle" />
          </g>
        </svg>
        <span className="orbit-core" aria-hidden="true">
          <Icon size={30} strokeWidth={1.5} />
        </span>
      </button>
      <h1 id="loading-heading">{t("loading.title")}</h1>
      <p
        className="loading-activity"
        role="status"
        aria-label={t("loading.live")}
        aria-live="polite"
        aria-atomic="true"
      >
        {t(`loading.${label}`)}
      </p>
    </section>
  );
}

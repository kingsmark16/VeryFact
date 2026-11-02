import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Verdict } from "../api/check-api";
import {
  CheckCircle2,
  Check,
  AlertTriangle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface VerdictConfig {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
}

const VERDICT_STYLES: Record<Verdict, VerdictConfig> = {
  TRUE: {
    label: "result.true",
    className:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  MOSTLY_TRUE: {
    label: "result.mostlyTrue",
    className:
      "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
    icon: Check,
  },
  MIXED: {
    label: "result.mixed",
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
  },
  MOSTLY_FALSE: {
    label: "result.mostlyFalse",
    className:
      "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
    icon: AlertCircle,
  },
  FALSE: {
    label: "result.false",
    className:
      "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  UNVERIFIABLE: {
    label: "result.unverifiable",
    className:
      "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800",
    icon: HelpCircle,
  },
  SATIRE_OR_OPINION: {
    label: "result.satire",
    className:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
    icon: Sparkles,
  },
};

export function VerdictBadge({ verdict, className }: { verdict?: Verdict; className?: string }) {
  const { t } = useTranslation();
  if (!verdict) return null;
  const config = VERDICT_STYLES[verdict];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        config.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>{t(config.label)}</span>
    </Badge>
  );
}

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
    label: "True",
    className: "bg-emerald-600/90 text-white border-emerald-500 shadow-xs shadow-emerald-600/20",
    icon: CheckCircle2,
  },
  MOSTLY_TRUE: {
    label: "Mostly true",
    className: "bg-teal-600/90 text-white border-teal-500 shadow-xs shadow-teal-600/20",
    icon: Check,
  },
  MIXED: {
    label: "Mixed",
    className: "bg-amber-500/90 text-white border-amber-400 shadow-xs shadow-amber-500/20",
    icon: AlertTriangle,
  },
  MOSTLY_FALSE: {
    label: "Mostly false",
    className: "bg-orange-600/90 text-white border-orange-500 shadow-xs shadow-orange-600/20",
    icon: AlertCircle,
  },
  FALSE: {
    label: "False",
    className: "bg-rose-600/90 text-white border-rose-500 shadow-xs shadow-rose-600/20",
    icon: XCircle,
  },
  UNVERIFIABLE: {
    label: "Unverifiable",
    className: "bg-slate-600/90 text-white border-slate-500 shadow-xs shadow-slate-600/20",
    icon: HelpCircle,
  },
  SATIRE_OR_OPINION: {
    label: "Satire / opinion",
    className: "bg-purple-600/90 text-white border-purple-500 shadow-xs shadow-purple-600/20",
    icon: Sparkles,
  },
};

export function VerdictBadge({ verdict, className }: { verdict?: Verdict; className?: string }) {
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
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}

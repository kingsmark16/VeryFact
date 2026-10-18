import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Verdict } from "../api/check-api";

const VERDICT_STYLES: Record<Verdict, { label: string; className: string }> = {
  TRUE: { label: "True", className: "bg-green-600 text-white" },
  MOSTLY_TRUE: { label: "Mostly true", className: "bg-lime-600 text-white" },
  MIXED: { label: "Mixed", className: "bg-amber-500 text-white" },
  MOSTLY_FALSE: { label: "Mostly false", className: "bg-orange-600 text-white" },
  FALSE: { label: "False", className: "bg-red-600 text-white" },
  UNVERIFIABLE: { label: "Unverifiable", className: "bg-slate-500 text-white" },
  SATIRE_OR_OPINION: { label: "Satire / opinion", className: "bg-purple-600 text-white" },
};

export function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  if (!verdict) return null;
  const { label, className } = VERDICT_STYLES[verdict];
  return <Badge className={cn(className)}>{label}</Badge>;
}

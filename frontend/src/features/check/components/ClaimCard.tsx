import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Claim } from "../api/check-api";
import { VerdictBadge } from "./VerdictBadge";
import { ExternalLink, ShieldAlert, BookOpen, Quote } from "lucide-react";

function isSafeHttpUrl(url?: string): url is string {
  return Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));
}

function getVerdictBorder(verdict?: string) {
  switch (verdict) {
    case "TRUE":
    case "MOSTLY_TRUE":
      return "border-l-emerald-500";
    case "MIXED":
      return "border-l-amber-500";
    case "MOSTLY_FALSE":
    case "FALSE":
      return "border-l-rose-500";
    default:
      return "border-l-slate-400";
  }
}

export function ClaimCard({ claim }: { claim: Claim }) {
  const safeSources = (claim.sources ?? []).filter((s) => isSafeHttpUrl(s.url));
  const safeFactChecks = (claim.factChecks ?? []).filter((fc) => isSafeHttpUrl(fc.url));
  const confidencePct =
    typeof claim.confidence === "number" ? Math.round(claim.confidence * 100) : null;

  const borderAccent = getVerdictBorder(claim.verdict);

  return (
    <Card
      className={`overflow-hidden border-l-4 ${borderAccent} shadow-xs transition-shadow hover:shadow-md`}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex shrink-0 items-center gap-2">
            <VerdictBadge verdict={claim.verdict} />
            {confidencePct !== null && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {confidencePct}% confidence
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
          <CardTitle className="text-base font-semibold leading-snug tracking-tight text-foreground">
            {claim.claim}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 text-sm">
        <p className="leading-relaxed text-foreground/90">{claim.explanation}</p>

        {safeFactChecks.length > 0 && (
          <div className="space-y-2 rounded-xl border border-blue-500/20 bg-blue-50/40 p-3.5 dark:bg-blue-950/20">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-semibold tracking-wide text-blue-900 dark:text-blue-300">
                Professional Fact-Checks
              </p>
            </div>
            <ul className="space-y-2">
              {safeFactChecks.map((fc) => (
                <li key={fc.url} className="flex flex-wrap items-center gap-2 text-xs">
                  {fc.textualRating && (
                    <Badge
                      variant="outline"
                      className="border-blue-400/40 bg-background text-[11px] font-semibold text-blue-700 dark:text-blue-300"
                    >
                      {fc.textualRating}
                    </Badge>
                  )}
                  <a
                    href={fc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 font-medium text-blue-700 hover:underline dark:text-blue-300"
                  >
                    <span>{fc.title || fc.claimText || fc.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </a>
                  {fc.publisher && <span className="text-muted-foreground">— {fc.publisher}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {safeSources.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sources
              </p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {safeSources.map((source) => (
                <li
                  key={source.url}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-blue-500/50 hover:bg-muted"
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 font-medium text-foreground/90 hover:underline"
                  >
                    <span className="truncate max-w-[240px]">{source.title || source.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
                  </a>
                  {source.publisher && (
                    <span className="text-[11px] text-muted-foreground">({source.publisher})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

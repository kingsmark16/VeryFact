import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Claim } from "../api/check-api";
import { VerdictBadge } from "./VerdictBadge";
import { ExternalLink, ShieldCheck, BookOpen, Quote, Copy, Check, Globe } from "lucide-react";

function isSafeHttpUrl(url?: string): url is string {
  return Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));
}

function getVerdictBorder(verdict?: string) {
  switch (verdict) {
    case "TRUE":
    case "MOSTLY_TRUE":
      return "border-l-emerald-500 bg-emerald-500/[0.02]";
    case "MIXED":
      return "border-l-amber-500 bg-amber-500/[0.02]";
    case "MOSTLY_FALSE":
    case "FALSE":
      return "border-l-rose-500 bg-rose-500/[0.02]";
    default:
      return "border-l-slate-400 bg-slate-500/[0.02]";
  }
}

export function ClaimCard({ claim }: { claim: Claim }) {
  const [copied, setCopied] = useState(false);
  const safeSources = (claim.sources ?? []).filter((s) => isSafeHttpUrl(s.url));
  const safeFactChecks = (claim.factChecks ?? []).filter((fc) => isSafeHttpUrl(fc.url));
  const confidencePct =
    typeof claim.confidence === "number" ? Math.round(claim.confidence * 100) : null;

  const borderAccent = getVerdictBorder(claim.verdict);

  function handleCopyClaim() {
    navigator.clipboard.writeText(claim.claim ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl border border-border/80 border-l-4 ${borderAccent} shadow-2xs transition-all duration-200 hover:border-border hover:shadow-md`}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex shrink-0 items-center gap-2">
            <VerdictBadge verdict={claim.verdict} />
            {confidencePct !== null && (
              <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground font-mono">
                {confidencePct}% confidence
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyClaim}
            aria-label="Copy claim statement"
            className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground opacity-70 transition-all hover:bg-muted hover:text-foreground hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy claim</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Quote className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
            {claim.claim}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 text-sm">
        <p className="leading-relaxed text-foreground/90 font-normal">{claim.explanation}</p>

        {/* Professional Fact-Checks */}
        {safeFactChecks.length > 0 && (
          <div className="space-y-2.5 rounded-xl border border-blue-500/20 bg-blue-50/40 p-4 dark:bg-blue-950/20">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-bold tracking-wide text-blue-950 dark:text-blue-200">
                Professional Fact-Checks
              </p>
            </div>
            <ul className="space-y-2">
              {safeFactChecks.map((fc) => (
                <li key={fc.url} className="flex flex-wrap items-center gap-2 text-xs">
                  {fc.textualRating && (
                    <Badge
                      variant="outline"
                      className="border-blue-400/50 bg-background/90 text-[11px] font-semibold text-blue-800 dark:text-blue-200"
                    >
                      {fc.textualRating}
                    </Badge>
                  )}
                  <a
                    href={fc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    <span>{fc.title || fc.claimText || fc.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover/link:opacity-100" />
                  </a>
                  {fc.publisher && <span className="text-muted-foreground">— {fc.publisher}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Sources & Evidence */}
        {safeSources.length > 0 && (
          <div className="space-y-2.5 border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Sources
              </p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {safeSources.map((source) => (
                <li
                  key={source.url}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-blue-500/50 hover:bg-muted"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/src inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                  >
                    <span className="max-w-[260px] truncate sm:max-w-xs">
                      {source.title || source.url}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-60 group-hover/src:opacity-100" />
                  </a>
                  {source.publisher && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ({source.publisher})
                    </span>
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

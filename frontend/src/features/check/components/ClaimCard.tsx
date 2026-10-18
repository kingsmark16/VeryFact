import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Claim } from "../api/check-api";
import { VerdictBadge } from "./VerdictBadge";

function isSafeHttpUrl(url?: string): url is string {
  return Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));
}

export function ClaimCard({ claim }: { claim: Claim }) {
  const safeSources = (claim.sources ?? []).filter((s) => isSafeHttpUrl(s.url));
  const safeFactChecks = (claim.factChecks ?? []).filter((fc) => isSafeHttpUrl(fc.url));
  const confidencePct =
    typeof claim.confidence === "number" ? Math.round(claim.confidence * 100) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle className="text-base">{claim.claim}</CardTitle>
        <div className="flex shrink-0 items-center gap-2">
          {confidencePct !== null && (
            <span className="text-xs text-muted-foreground">{confidencePct}% confidence</span>
          )}
          <VerdictBadge verdict={claim.verdict} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>{claim.explanation}</p>

        {safeFactChecks.length > 0 && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Professional Fact-Checks
            </p>
            <ul className="space-y-1.5">
              {safeFactChecks.map((fc) => (
                <li key={fc.url} className="flex flex-wrap items-center gap-2">
                  {fc.textualRating && <Badge variant="outline">{fc.textualRating}</Badge>}
                  <a href={fc.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {fc.title || fc.claimText || fc.url}
                  </a>
                  {fc.publisher && <span className="text-muted-foreground">— {fc.publisher}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {safeSources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {safeSources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {source.title || source.url}
                  </a>
                  {source.publisher && (
                    <span className="text-muted-foreground"> — {source.publisher}</span>
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

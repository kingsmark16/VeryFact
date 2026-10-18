import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Claim } from "../api/check-api";
import { VerdictBadge } from "./VerdictBadge";

export function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle className="text-base">{claim.claim}</CardTitle>
        <VerdictBadge verdict={claim.verdict} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{claim.explanation}</p>
        {claim.sources && claim.sources.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {claim.sources.map((source) => (
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
        )}
      </CardContent>
    </Card>
  );
}

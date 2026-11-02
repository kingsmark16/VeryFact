import { useTranslation } from "react-i18next";
import { ExternalLink, ChevronDown, BookOpen } from "lucide-react";
import type { Claim } from "../api/check-api";
import { VerdictBadge } from "./VerdictBadge";
import "@/lib/i18n";

function isSafeHttpUrl(url?: string): url is string {
  try {
    const parsed = new URL(url ?? "");
    return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
export function ClaimCard({ claim, number = 1 }: { claim: Claim; number?: number }) {
  const { t } = useTranslation();
  const sources = (claim.sources ?? []).filter((source) => isSafeHttpUrl(source.url));
  const factChecks = (claim.factChecks ?? []).filter((source) => isSafeHttpUrl(source.url));
  const confidence =
    typeof claim.confidence === "number" ? Math.round(claim.confidence * 100) : null;
  return (
    <article className="evidence-card" aria-labelledby={`claim-title-${number}`}>
      <div className="claim-topline">
        <span className="claim-number">{t("result.claimNumber", { number: String(number) })}</span>
        <VerdictBadge verdict={claim.verdict} />
      </div>
      <h3 id={`claim-title-${number}`}>{claim.claim}</h3>
      <p className="claim-explanation">{claim.explanation}</p>
      <div className="claim-confidence">
        {confidence !== null && (
          <span>
            {confidence}% {t("result.confidence")}
          </span>
        )}
      </div>
      <details className="claim-evidence" open>
        <summary>
          <span>
            <BookOpen size={16} aria-hidden="true" />
            {t("result.evidence")}
            <span className="evidence-count">{sources.length + factChecks.length}</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="evidence-body">
          {factChecks.length > 0 && (
            <div className="fact-check-sources">
              <h4>{t("result.factChecks")}</h4>
              <ul>
                {factChecks.map((source, index) => (
                  <li key={`${source.url}-${index}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-row"
                    >
                      <span className="source-index" aria-hidden="true">
                        {String(index + 1)}
                      </span>
                      <span className="source-text">
                        <strong>{source.title || source.claimText || source.url}</strong>
                        <small>
                          {source.publisher}
                          {source.textualRating ? ` / ${source.textualRating}` : ""}
                        </small>
                      </span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sources.length > 0 && (
            <ul>
              {sources.map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-row"
                  >
                    <span className="source-index" aria-hidden="true">
                      {String(index + 1)}
                    </span>
                    <span className="source-text">
                      <strong>{source.title || source.url}</strong>
                      <small>{source.publisher || new URL(source.url!).hostname}</small>
                    </span>
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {sources.length + factChecks.length === 0 && (
            <p className="no-evidence">{t("result.sourceEmpty")}</p>
          )}
        </div>
      </details>
    </article>
  );
}

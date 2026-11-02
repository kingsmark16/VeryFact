import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUpRight,
  AlertTriangle,
  ChevronDown,
  RotateCcw,
  FileQuestion,
  Info,
  BookOpen,
  Check,
} from "lucide-react";
import { ApiError } from "@/api/axios-client";
import { Button } from "@/components/ui/button";
import { useCheckResult, type Verdict, type Claim } from "../api/check-api";
import { ClaimCard } from "../components/ClaimCard";
import { ProgressSteps } from "../components/ProgressSteps";
import { ShareButton } from "../components/ShareButton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type ClaimFilter = "all" | "supported" | "disputed" | "uncertain";
const verdictLabels: Record<Verdict, string> = {
  TRUE: "true",
  MOSTLY_TRUE: "mostlyTrue",
  MIXED: "mixed",
  MOSTLY_FALSE: "mostlyFalse",
  FALSE: "false",
  UNVERIFIABLE: "unverifiable",
  SATIRE_OR_OPINION: "satire",
};
function category(claim: Claim): ClaimFilter {
  if (claim.verdict === "TRUE" || claim.verdict === "MOSTLY_TRUE") return "supported";
  if (claim.verdict === "FALSE" || claim.verdict === "MOSTLY_FALSE") return "disputed";
  return "uncertain";
}
function safeUrl(url?: string): url is string {
  try {
    const parsed = new URL(url ?? "");
    return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export default function ResultPage() {
  const { t } = useTranslation();
  const { slug = "" } = useParams();
  const { data, error, isPending, refetch, isFetching } = useCheckResult(slug);
  const [filter, setFilter] = useState<ClaimFilter>("all");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStatus = useRef(data?.status);
  useEffect(() => {
    if (
      (previousStatus.current === "PENDING" || previousStatus.current === "PROCESSING") &&
      data?.status === "COMPLETED"
    )
      headingRef.current?.focus({ preventScroll: true });
    previousStatus.current = data?.status;
  }, [data?.status]);
  const inProgress = data?.status === "PENDING" || data?.status === "PROCESSING";
  const complete = data?.status === "COMPLETED";
  const claims = data?.claims ?? [];
  const filtered = claims
    .map((claim, index) => ({ claim, number: index + 1 }))
    .filter(({ claim }) => filter === "all" || category(claim) === filter);
  const sourceCount = new Set(
    claims
      .flatMap((claim) => [...(claim.sources ?? []), ...(claim.factChecks ?? [])])
      .map((source) => source.url)
      .filter(safeUrl),
  ).size;
  const confidence =
    typeof data?.confidence === "number" ? Math.round(data.confidence * 100) : null;
  const notFound = error instanceof ApiError && error.status === 404;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className={`report-main ${!error && (isPending || inProgress) ? "is-loading" : ""}`}
      >
        <div className="report-toolbar">
          <Link to="/" className="report-back">
            <ArrowLeft size={16} aria-hidden="true" />
            {t("newCheck")}
          </Link>
          {data && !error && !inProgress && <ShareButton />}
        </div>
        {error ? (
          <section className="report-empty" role="alert">
            <FileQuestion size={36} aria-hidden="true" />
            <h1>{t(`result.${notFound ? "unavailable" : "fetchError"}`)}</h1>
            <p>{t(notFound ? "unavailable" : "error")}</p>
            {!notFound && (
              <Button
                onClick={() => {
                  void refetch();
                }}
                disabled={isFetching}
                className="min-h-11"
              >
                {t("result.retry")}
              </Button>
            )}
            <Link to="/" className="text-primary underline underline-offset-4">
              {t("result.newCheck")}
            </Link>
          </section>
        ) : isPending || inProgress ? (
          <ProgressSteps stage={data?.stage} opening={isPending} />
        ) : data?.status === "FAILED" ? (
          <section className="report-empty report-failed" role="alert">
            <span className="failure-icon">
              <AlertTriangle size={28} aria-hidden="true" />
            </span>
            <p className="eyebrow">{t("reportTitle")}</p>
            <h1>{t("result.failed")}</h1>
            <p>{data.errorMessage || t("result.failedDetail")}</p>
            <Link to="/" className="report-primary-link">
              <RotateCcw size={16} aria-hidden="true" />
              {t("result.newCheck")}
            </Link>
          </section>
        ) : complete ? (
          <div className="report-reveal">
            <header className="report-page-heading">
              <p className="eyebrow">{t("result.eyebrow")}</p>
              <h1 className="sr-only">{t("result.title")}</h1>
            </header>
            <section className="verdict-overview" aria-labelledby="verdict-heading">
              <div className="verdict-copy">
                <div className="report-complete-tag">
                  <Check size={14} aria-hidden="true" />
                  {t("result.overall")}
                </div>
                <h2
                  id="verdict-heading"
                  ref={headingRef}
                  tabIndex={-1}
                  data-verdict={data.overallVerdict}
                >
                  {t(
                    `result.${data.overallVerdict ? verdictLabels[data.overallVerdict] : "noVerdict"}`,
                  )}
                </h2>
                <p>{data.summary}</p>
                <a href="#claim-evidence" className="evidence-jump">
                  {t("result.readEvidence")}
                  <ArrowDown size={16} aria-hidden="true" />
                </a>
              </div>
              <aside className="report-facts" aria-label={t("result.summary")}>
                <div>
                  <span>{t("result.reviewed")}</span>
                  <strong>{String(claims.length)}</strong>
                </div>
                <div>
                  <span>{t("result.cited")}</span>
                  <strong>{String(sourceCount)}</strong>
                </div>
                {confidence !== null && (
                  <div className="confidence-stat">
                    <span>{t("result.confidence")}</span>
                    <strong>
                      {confidence}
                      <small>%</small>
                    </strong>
                    <details>
                      <summary>
                        <Info size={14} aria-hidden="true" />
                        <span className="sr-only">{t("result.confidenceDetail")}</span>
                      </summary>
                      <p>{t("result.confidenceDetail")}</p>
                    </details>
                  </div>
                )}
              </aside>
            </section>
            {(data.inputExcerpt || safeUrl(data.sourceUrl)) && (
              <details className="submitted-content">
                <summary>
                  <span>{t("result.submission")}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <div>
                  {data.inputExcerpt && <p>{data.inputExcerpt}</p>}
                  {safeUrl(data.sourceUrl) && (
                    <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {t("result.original")}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </details>
            )}
            {data.redFlags && data.redFlags.length > 0 && (
              <details className="report-notes" open>
                <summary>
                  <span>
                    <AlertTriangle size={16} aria-hidden="true" />
                    {t("result.notes")}
                    <span className="evidence-count">{data.redFlags.length}</span>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <ul>
                  {data.redFlags.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </details>
            )}
            <section id="claim-evidence" className="claim-section" aria-labelledby="claims-heading">
              <div className="claims-heading">
                <div>
                  <BookOpen size={19} aria-hidden="true" />
                  <h2 id="claims-heading">
                    {t("result.claims")} <span>{claims.length}</span>
                  </h2>
                </div>
                {claims.length > 1 && (
                  <div className="claim-filters" role="group" aria-label={t("result.filters")}>
                    {(["all", "supported", "disputed", "uncertain"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                      >
                        {t(`result.${value}`)}{" "}
                        <span>
                          {value === "all"
                            ? claims.length
                            : claims.filter((claim) => category(claim) === value).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="claim-list">
                {filtered.map(({ claim, number }) => (
                  <ClaimCard key={`${slug}-${number}`} claim={claim} number={number} />
                ))}
                {filtered.length === 0 && (
                  <p className="filter-empty" role="status">
                    {t("result.empty")}
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <section className="report-empty">
            <h1>{t("result.fetchError")}</h1>
            <Button
              onClick={() => {
                void refetch();
              }}
            >
              {t("result.retry")}
            </Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

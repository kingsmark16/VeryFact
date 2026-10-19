import { useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "@/api/axios-client";
import { Progress } from "@/components/ui/progress";
import { useCheckResult } from "../api/check-api";
import { ClaimCard } from "../components/ClaimCard";
import { ProgressSteps } from "../components/ProgressSteps";
import { ShareButton } from "../components/ShareButton";
import { VerdictBadge } from "../components/VerdictBadge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  RotateCcw,
  Cpu,
  FileCheck2,
} from "lucide-react";

type ClaimFilter = "ALL" | "FALSE_OR_MISLEADING" | "TRUE_OR_MOSTLY" | "OTHER";

function getVerdictTheme(verdict?: string) {
  switch (verdict) {
    case "TRUE":
    case "MOSTLY_TRUE":
      return {
        cardBorder: "border-emerald-500/40",
        badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        bgGradient: "from-emerald-50/50 via-card to-card dark:from-emerald-950/25",
        accentColor: "text-emerald-600 dark:text-emerald-400",
      };
    case "MIXED":
      return {
        cardBorder: "border-amber-500/40",
        badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        bgGradient: "from-amber-50/50 via-card to-card dark:from-amber-950/25",
        accentColor: "text-amber-600 dark:text-amber-400",
      };
    case "MOSTLY_FALSE":
    case "FALSE":
      return {
        cardBorder: "border-rose-500/40",
        badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
        bgGradient: "from-rose-50/50 via-card to-card dark:from-rose-950/25",
        accentColor: "text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        cardBorder: "border-slate-500/30",
        badgeBg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
        bgGradient: "from-slate-50/50 via-card to-card dark:from-slate-900/25",
        accentColor: "text-slate-600 dark:text-slate-400",
      };
  }
}

export default function ResultPage() {
  const { slug = "" } = useParams();
  const { data, error, isPending } = useCheckResult(slug);
  const [filter, setFilter] = useState<ClaimFilter>("ALL");

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex min-h-screen flex-col bg-background bg-dot-pattern">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-8 shadow-lg">
            <h1 className="text-2xl font-bold">Result not found</h1>
            <p className="text-sm text-muted-foreground">
              This verification slug does not exist or may have expired.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Check something else</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-background bg-dot-pattern">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-6 py-4 shadow-sm">
            <Sparkles className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-foreground">
              Loading verification report…
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <p role="alert" className="text-sm font-semibold text-destructive">
              Something went wrong. Please try again.
            </p>
            <Link to="/" className="text-sm font-medium text-blue-600 underline">
              Return to home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inProgress = data.status === "PENDING" || data.status === "PROCESSING";
  const confidencePct =
    typeof data.confidence === "number" ? Math.round(data.confidence * 100) : null;
  const theme = getVerdictTheme(data.overallVerdict);

  // Filter claims logic
  const allClaims = data.claims ?? [];
  const filteredClaims = allClaims.filter((c) => {
    if (filter === "FALSE_OR_MISLEADING") {
      return c.verdict === "FALSE" || c.verdict === "MOSTLY_FALSE";
    }
    if (filter === "TRUE_OR_MOSTLY") {
      return c.verdict === "TRUE" || c.verdict === "MOSTLY_TRUE";
    }
    if (filter === "OTHER") {
      return (
        c.verdict === "MIXED" || c.verdict === "UNVERIFIABLE" || c.verdict === "SATIRE_OR_OPINION"
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background bg-dot-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        {/* Navigation & Report Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>← New check</span>
            </Link>

            <span className="hidden text-xs text-muted-foreground font-mono sm:inline">
              /r/{data.slug}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {data.modelVersion && (
              <span className="hidden items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground md:inline-flex">
                <Cpu className="h-3 w-3" />
                <span>{data.modelVersion}</span>
              </span>
            )}
            <ShareButton />
          </div>
        </div>

        {/* Live Multi-Stage Stepper during analysis */}
        {inProgress && (
          <div className="space-y-4">
            <ProgressSteps stage={data.stage} />
            <p className="text-center text-xs text-muted-foreground font-medium">
              Live analysis in progress. This report polls and updates automatically.
            </p>
          </div>
        )}

        {/* Failed Check Callout */}
        {data.status === "FAILED" && (
          <div
            role="alert"
            className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive"
          >
            <div className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="h-5 w-5" />
              <span>Verification Unsuccessful</span>
            </div>
            <p className="mt-2 text-sm text-destructive/90">
              {data.errorMessage || "The check could not be completed. Please try again."}
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try another check</span>
              </Link>
            </div>
          </div>
        )}

        {/* Completed Verdict Report Card */}
        {data.status === "COMPLETED" && (
          <>
            <section
              className={`relative overflow-hidden rounded-3xl border-2 ${theme.cardBorder} bg-linear-to-b ${theme.bgGradient} p-6 shadow-lg shadow-slate-200/40 backdrop-blur-md dark:shadow-none sm:p-8`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className={`h-5 w-5 ${theme.accentColor}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Official Investigation Verdict
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      Overall verdict
                    </h1>
                    <div className="animate-stamp">
                      <VerdictBadge
                        verdict={data.overallVerdict}
                        className="px-3.5 py-1 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                {confidencePct !== null && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-3.5 py-1 shadow-2xs">
                      <span className="text-xs font-medium text-muted-foreground">Confidence:</span>
                      <span className="text-xs font-bold text-foreground font-mono">
                        {confidencePct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {confidencePct !== null && (
                <div className="mt-4 space-y-1.5">
                  <Progress value={confidencePct} className="h-2.5 rounded-full" />
                </div>
              )}

              <p className="mt-5 text-sm leading-relaxed font-normal text-foreground/95 sm:text-base">
                {data.summary}
              </p>

              {data.sourceUrl &&
                (data.sourceUrl.startsWith("https://") || data.sourceUrl.startsWith("http://")) && (
                  <div className="mt-4 border-t border-border/50 pt-3">
                    <a
                      href={data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-blue-500/50 hover:text-foreground"
                    >
                      <span className="font-semibold text-foreground">Verified URL:</span>
                      <span className="max-w-[240px] truncate underline sm:max-w-md">
                        {data.sourceUrl}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                  </div>
                )}
            </section>

            {/* Red Flags Alert Card */}
            {data.redFlags && data.redFlags.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-50/50 p-5 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-sm font-bold tracking-wide text-amber-950 dark:text-amber-200">
                    Red flags
                  </h2>
                </div>
                <ul className="space-y-1.5 pl-6 text-xs text-amber-950/90 dark:text-amber-200/90 list-disc">
                  {data.redFlags.map((flag) => (
                    <li key={flag} className="leading-relaxed">
                      {flag}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Individual Extracted Claims Section with Interactive Filter Tabs */}
            <section className="space-y-4 pt-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Claims ({allClaims.length})
                  </h2>
                </div>

                {allClaims.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border/80 bg-muted/40 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilter("ALL")}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                        filter === "ALL"
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All ({allClaims.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("FALSE_OR_MISLEADING")}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                        filter === "FALSE_OR_MISLEADING"
                          ? "bg-background text-rose-600 shadow-2xs dark:text-rose-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      False / Misleading
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("TRUE_OR_MOSTLY")}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                        filter === "TRUE_OR_MOSTLY"
                          ? "bg-background text-emerald-600 shadow-2xs dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      True
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {filteredClaims.map((claim) => (
                  <ClaimCard key={claim.claim} claim={claim} />
                ))}

                {filteredClaims.length === 0 && (
                  <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                    No claims match the selected filter.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

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
  Clock,
} from "lucide-react";

function getVerdictTheme(verdict?: string) {
  switch (verdict) {
    case "TRUE":
    case "MOSTLY_TRUE":
      return {
        cardBorder: "border-emerald-500/30",
        bgGradient: "from-emerald-50/50 via-card to-card dark:from-emerald-950/20",
        progressColor: "bg-emerald-600",
      };
    case "MIXED":
      return {
        cardBorder: "border-amber-500/30",
        bgGradient: "from-amber-50/50 via-card to-card dark:from-amber-950/20",
        progressColor: "bg-amber-500",
      };
    case "MOSTLY_FALSE":
    case "FALSE":
      return {
        cardBorder: "border-rose-500/30",
        bgGradient: "from-rose-50/50 via-card to-card dark:from-rose-950/20",
        progressColor: "bg-rose-600",
      };
    default:
      return {
        cardBorder: "border-slate-500/20",
        bgGradient: "from-slate-50/50 via-card to-card dark:from-slate-900/20",
        progressColor: "bg-slate-600",
      };
  }
}

export default function ResultPage() {
  const { slug = "" } = useParams();
  const { data, error, isPending } = useCheckResult(slug);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Result not found</h1>
            <p className="text-sm text-muted-foreground">
              This check result link doesn&apos;t exist or may have expired.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Check something else</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading check result…</span>
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
          <div className="space-y-3">
            <p role="alert" className="text-sm font-medium text-destructive">
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

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-blue-50/20 via-background to-background dark:from-slate-950 dark:via-background dark:to-background">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        {/* Top Action & Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>← New check</span>
          </Link>

          <div className="flex items-center gap-3">
            {data.completedAt && (
              <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                <Clock className="h-3 w-3" />
                <span>Verified</span>
              </span>
            )}
            <ShareButton />
          </div>
        </div>

        {/* In-Progress Stepper */}
        {inProgress && (
          <div className="space-y-4">
            <ProgressSteps stage={data.stage} />
            <p className="text-center text-xs text-muted-foreground">
              This page automatically refreshes in real-time as analysis completes.
            </p>
          </div>
        )}

        {/* Failed Check Callout */}
        {data.status === "FAILED" && (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Verification Unsuccessful</span>
            </div>
            <p className="mt-1.5 text-destructive/90">
              {data.errorMessage || "The check failed. Please try again."}
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try another check</span>
              </Link>
            </div>
          </div>
        )}

        {/* Completed Verdict Summary */}
        {data.status === "COMPLETED" && (
          <>
            <section
              className={`space-y-4 rounded-2xl border ${theme.cardBorder} bg-linear-to-b ${theme.bgGradient} p-6 shadow-md shadow-slate-200/30 backdrop-blur-xs dark:shadow-none sm:p-7`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Overall verdict
                  </h1>
                  <VerdictBadge verdict={data.overallVerdict} className="text-sm px-3 py-1" />
                </div>

                {confidencePct !== null && (
                  <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 shadow-xs">
                    <span className="text-xs font-medium text-muted-foreground">Confidence:</span>
                    <span className="text-xs font-bold text-foreground">{confidencePct}%</span>
                  </div>
                )}
              </div>

              {confidencePct !== null && (
                <div className="space-y-1.5">
                  <Progress value={confidencePct} className="h-2" />
                </div>
              )}

              <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                {data.summary}
              </p>

              {data.sourceUrl &&
                (data.sourceUrl.startsWith("https://") || data.sourceUrl.startsWith("http://")) && (
                  <div className="pt-2">
                    <a
                      href={data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-blue-500/40"
                    >
                      <span className="font-semibold text-foreground">Source URL:</span>
                      <span className="truncate max-w-[280px] sm:max-w-md underline">
                        {data.sourceUrl}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                  </div>
                )}
            </section>

            {/* Red Flags Callout */}
            {data.redFlags && data.redFlags.length > 0 && (
              <section className="space-y-2.5 rounded-xl border border-amber-500/25 bg-amber-50/40 p-4.5 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-sm font-semibold tracking-wide text-amber-900 dark:text-amber-300">
                    Red flags
                  </h2>
                </div>
                <ul className="space-y-1.5 pl-6 text-xs text-amber-900/90 dark:text-amber-200/90 list-disc">
                  {data.redFlags.map((flag) => (
                    <li key={flag} className="leading-relaxed">
                      {flag}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Individual Extracted Claims */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    Claims ({data.claims?.length ?? 0})
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  Individual assertions verified
                </span>
              </div>

              <div className="space-y-4">
                {data.claims?.map((claim) => (
                  <ClaimCard key={claim.claim} claim={claim} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

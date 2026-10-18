import { Link, useParams } from "react-router";
import { ApiError } from "@/api/axios-client";
import { useCheckResult } from "../api/check-api";
import { ClaimCard } from "../components/ClaimCard";
import { ProgressSteps } from "../components/ProgressSteps";
import { VerdictBadge } from "../components/VerdictBadge";

export default function ResultPage() {
  const { slug = "" } = useParams();
  const { data, error, isPending } = useCheckResult(slug);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Result not found</h1>
        <Link to="/" className="underline">
          Check something else
        </Link>
      </main>
    );
  }

  if (isPending) {
    return <main className="mx-auto max-w-2xl p-6">Loading…</main>;
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p role="alert">Something went wrong. Please try again.</p>
      </main>
    );
  }

  const inProgress = data.status === "PENDING" || data.status === "PROCESSING";

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <Link to="/" className="text-sm underline">
        ← New check
      </Link>

      {inProgress && <ProgressSteps stage={data.stage} />}

      {data.status === "FAILED" && (
        <p role="alert" className="text-red-600">
          {data.errorMessage || "The check failed. Please try again."}
        </p>
      )}

      {data.status === "COMPLETED" && (
        <>
          <section className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Overall verdict</h1>
              <VerdictBadge verdict={data.overallVerdict} />
            </div>
            <p>{data.summary}</p>
          </section>

          {data.redFlags && data.redFlags.length > 0 && (
            <section>
              <h2 className="font-semibold">Red flags</h2>
              <ul className="list-disc pl-5 text-sm">
                {data.redFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold">Claims</h2>
            {data.claims?.map((claim) => (
              <ClaimCard key={claim.claim} claim={claim} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

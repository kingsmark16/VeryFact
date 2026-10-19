import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "@/api/axios-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCheck } from "../api/check-api";
import { ImageDropzone } from "../components/ImageDropzone";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  FileText,
  Link2,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";

type InputMode = "text" | "url" | "images";

const MIN_LENGTH = 20;
const MAX_LENGTH = 20000;

const SAMPLE_PROMPTS = [
  {
    mode: "text" as const,
    title: "Tesla flying car announcement",
    content:
      "Elon Musk confirmed that Tesla and SpaceX are unveiling a functional commercial flying car in 2028 equipped with thrusters.",
  },
  {
    mode: "url" as const,
    title: "Asteroid flyby report",
    url: "https://www.nasa.gov/news-release/asteroid-watch",
    content: "NASA confirms a harmless near-Earth asteroid passage this month.",
  },
  {
    mode: "text" as const,
    title: "Coffee & longevity claim",
    content:
      "Viral health article claims that drinking 5 liters of coffee every day prevents cellular aging and makes humans immortal.",
  },
];

export default function CheckPage() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const navigate = useNavigate();
  const createCheck = useCreateCheck();

  const trimmedLength = text.trim().length;
  const trimmedUrl = url.trim();

  const canSubmit =
    mode === "text"
      ? trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH
      : mode === "url"
        ? trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
        : images.length > 0;

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const payload =
      mode === "text"
        ? { text }
        : mode === "url"
          ? { url: trimmedUrl, text: trimmedLength > 0 ? text : undefined }
          : { images, text: trimmedLength > 0 ? text : undefined };

    createCheck.mutate(payload, {
      onSuccess: (data) => {
        if (data.slug) navigate(`/r/${data.slug}`);
      },
    });
  }

  function handleApplySample(sample: (typeof SAMPLE_PROMPTS)[number]) {
    setMode(sample.mode);
    if (sample.mode === "url" && sample.url) {
      setUrl(sample.url);
      setText(sample.content);
    } else {
      setText(sample.content);
      setUrl("");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-blue-50/30 via-background to-background dark:from-slate-950 dark:via-background dark:to-background">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Section */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Public Fact Checking</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Verify viral claims with{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              real evidence
            </span>
            .
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cross-check news stories, URLs, and social media screenshots against accredited
            fact-checkers and live web sources in seconds.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xs transition-shadow dark:shadow-none sm:p-8">
          {/* Segmented Tab Controls */}
          <div
            role="tablist"
            aria-label="Input type"
            className="mb-6 grid grid-cols-3 rounded-xl border border-border/80 bg-muted/50 p-1 text-xs font-medium sm:text-sm"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "text"}
              variant={mode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("text")}
              className={`gap-1.5 rounded-lg py-2 transition-all ${
                mode === "text"
                  ? "bg-background text-foreground shadow-xs hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Text</span>
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "url"}
              variant={mode === "url" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("url")}
              className={`gap-1.5 rounded-lg py-2 transition-all ${
                mode === "url"
                  ? "bg-background text-foreground shadow-xs hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link2 className="h-4 w-4 shrink-0" />
              <span>Article URL</span>
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "images"}
              variant={mode === "images" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("images")}
              className={`gap-1.5 rounded-lg py-2 transition-all ${
                mode === "images"
                  ? "bg-background text-foreground shadow-xs hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span>Images / Screenshots</span>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "text" && (
              <div className="space-y-1.5">
                <Textarea
                  aria-label="Article or claim text"
                  placeholder="Paste the statement, headline, or article excerpt you want to verify…"
                  rows={8}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="resize-y rounded-xl border-border/80 bg-background text-sm leading-relaxed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/20"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Minimum {MIN_LENGTH} characters required</span>
                  <span
                    className={
                      trimmedLength > 0 && trimmedLength < MIN_LENGTH
                        ? "font-semibold text-amber-600"
                        : ""
                    }
                  >
                    {trimmedLength} / {MAX_LENGTH}
                  </span>
                </div>
              </div>
            )}

            {mode === "url" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <input
                    type="url"
                    aria-label="Article URL"
                    placeholder="https://example.com/news-story"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm shadow-xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="px-1 text-xs text-muted-foreground">
                    Public article link (SSRF protected)
                  </p>
                </div>
                <Textarea
                  aria-label="Additional context (optional)"
                  placeholder="Optional: specific claim, quote, or context about this link…"
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="rounded-xl border-border/80 bg-background text-sm leading-relaxed"
                />
              </div>
            )}

            {mode === "images" && (
              <div className="space-y-3">
                <ImageDropzone files={images} onChange={setImages} />
                <Textarea
                  aria-label="Additional context (optional)"
                  placeholder="Optional: specific claim or context about the uploaded screenshot(s)…"
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="rounded-xl border-border/80 bg-background text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {mode === "text"
                  ? trimmedLength >= MIN_LENGTH
                    ? "Ready to verify"
                    : `Enter at least ${Math.max(0, MIN_LENGTH - trimmedLength)} more character(s)`
                  : mode === "url"
                    ? trimmedUrl.startsWith("http")
                      ? "Ready to verify URL"
                      : "Enter a valid http/https URL"
                    : `${images.length} / 4 images selected`}
              </span>

              <Button
                type="submit"
                disabled={!canSubmit || createCheck.isPending}
                size="lg"
                className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 sm:w-auto"
              >
                {createCheck.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <span>Check facts</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Error Message */}
            {createCheck.error instanceof ApiError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {createCheck.error.detail}
                  {createCheck.error.status === 429 && createCheck.error.retryAfterSeconds
                    ? ` (Retry after ~${Math.ceil(createCheck.error.retryAfterSeconds / 60)} min)`
                    : ""}
                </p>
              </div>
            )}
          </form>

          {/* Quick Samples Section */}
          <div className="mt-6 border-t border-border/60 pt-5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Try an example claim:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleApplySample(sample)}
                  className="rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue-500/50 hover:bg-muted"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Accredited Fact-Checks</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Queries the Google Fact Check Tools API for findings from verified journalists
              (PolitiFact, AFP, FactCheck.org).
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Live Search Grounding</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Gemini 3.8 Flash extracts sub-claims, detects rhetorical red flags, and checks against
              real-time web citations.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Privacy & Zero Logging</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              No account needed. IP rate limiting uses ephemeral in-memory salted hashes, and no
              client IPs or text are logged.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

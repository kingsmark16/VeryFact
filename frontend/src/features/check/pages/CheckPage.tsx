import { useState, useRef, type SyntheticEvent } from "react";
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
  ArrowRight,
  ShieldCheck,
  Search,
  Lock,
  Loader2,
  AlertCircle,
  Clipboard,
  Trash2,
  CheckCircle2,
} from "lucide-react";

type InputMode = "text" | "url" | "images";

const MIN_LENGTH = 20;
const MAX_LENGTH = 20000;

interface SampleClaim {
  mode: InputMode;
  category: string;
  title: string;
  url?: string;
  content: string;
}

const SAMPLE_PROMPTS: SampleClaim[] = [
  {
    mode: "text",
    category: "Automotive",
    title: "Tesla flying car claim",
    content:
      "Elon Musk confirmed that Tesla and SpaceX are unveiling a functional commercial flying car in 2028 equipped with thrusters.",
  },
  {
    mode: "url",
    category: "Science",
    title: "Asteroid 2026-X flyby",
    url: "https://www.nasa.gov/news-release/asteroid-watch",
    content: "NASA confirms a harmless near-Earth asteroid passage this month.",
  },
  {
    mode: "text",
    category: "Health",
    title: "Coffee & longevity viral post",
    content:
      "Viral health post claims that drinking 5 liters of coffee every day prevents cellular aging and makes humans immortal.",
  },
];

export default function CheckPage() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  function handleApplySample(sample: SampleClaim) {
    setMode(sample.mode);
    if (sample.mode === "url" && sample.url) {
      setUrl(sample.url);
      setText(sample.content);
    } else {
      setText(sample.content);
      setUrl("");
    }
    textareaRef.current?.focus();
  }

  async function handlePasteClipboard() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText((prev) => (prev ? `${prev}\n${clipText}` : clipText));
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  }

  // Circular character progress calculation
  const charProgressPct = Math.min(100, Math.round((trimmedLength / MIN_LENGTH) * 100));

  return (
    <div className="flex min-h-screen flex-col bg-background bg-dot-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Editorial Masthead Hero */}
        <div className="mb-8 space-y-3 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50/70 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Public Verification Terminal</span>
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Check facts against accredited sources.
          </h1>

          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Verify viral claims, articles, or social media screenshots with Google Fact Check Tools
            and Google Search grounding.
          </p>
        </div>

        {/* Interactive Verification Console Card */}
        <div className="rounded-3xl border border-border/90 bg-card p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-shadow dark:shadow-none sm:p-8">
          {/* Segmented Mode Selector */}
          <div
            role="tablist"
            aria-label="Input type"
            className="mb-6 grid grid-cols-3 rounded-2xl border border-border/80 bg-muted/60 p-1.5 text-xs font-semibold sm:text-sm"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "text"}
              variant={mode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("text")}
              className={`gap-2 rounded-xl py-2.5 transition-all ${
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
              className={`gap-2 rounded-xl py-2.5 transition-all ${
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
              className={`gap-2 rounded-xl py-2.5 transition-all ${
                mode === "images"
                  ? "bg-background text-foreground shadow-xs hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span>Screenshots</span>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mode: TEXT */}
            {mode === "text" && (
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    aria-label="Article or claim text"
                    placeholder="Paste the statement, article body, or viral rumor you want to verify…"
                    rows={8}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="w-full resize-y rounded-2xl border-border/80 bg-background/90 p-4 text-sm leading-relaxed shadow-2xs transition-all focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15"
                  />

                  {/* Micro Quick Actions inside Textarea */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    {text.length === 0 && (
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-xs transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Clipboard className="h-3 w-3" />
                        <span>Paste</span>
                      </button>
                    )}
                    {text.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setText("")}
                        aria-label="Clear input text"
                        className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-xs transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {trimmedLength >= MIN_LENGTH ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Length requirement met</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-blue-600 transition-all duration-150"
                            style={{ width: `${charProgressPct}%` }}
                          />
                        </div>
                        <span>
                          Need {Math.max(0, MIN_LENGTH - trimmedLength)} more character(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="font-mono">
                    {trimmedLength} / {MAX_LENGTH}
                  </span>
                </div>
              </div>
            )}

            {/* Mode: URL */}
            {mode === "url" && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <input
                    type="url"
                    aria-label="Article URL"
                    placeholder="https://example.com/news-story-to-verify"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  />
                  <p className="px-1 text-xs text-muted-foreground">
                    Public news URL. VeryFact extracts readable content with SSRF-safe redirects.
                  </p>
                </div>

                <Textarea
                  aria-label="Additional context (optional)"
                  placeholder="Optional: add specific context, timestamp, or particular claim to inspect within this article…"
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="rounded-2xl border-border/80 bg-background text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Mode: IMAGES */}
            {mode === "images" && (
              <div className="space-y-3.5">
                <ImageDropzone files={images} onChange={setImages} />
                <Textarea
                  aria-label="Additional context (optional)"
                  placeholder="Optional: add context about the screenshot(s), e.g., platform, viral date, or claimant…"
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="rounded-2xl border-border/80 bg-background text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Form Submission Footer */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {mode === "text"
                  ? trimmedLength >= MIN_LENGTH
                    ? "Ready for multi-source verification"
                    : `Enter at least ${Math.max(0, MIN_LENGTH - trimmedLength)} more character(s)`
                  : mode === "url"
                    ? trimmedUrl.startsWith("http")
                      ? "Ready to verify URL"
                      : "Enter a valid http/https URL"
                    : `${images.length} / 4 screenshots selected`}
              </span>

              <Button
                type="submit"
                disabled={!canSubmit || createCheck.isPending}
                size="lg"
                className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-7 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50 sm:w-auto"
              >
                {createCheck.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Analyzing claims…</span>
                  </>
                ) : (
                  <>
                    <span>Check facts</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Error Banner */}
            {createCheck.error instanceof ApiError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Unable to process check</p>
                  <p className="mt-0.5 text-xs text-destructive/90">
                    {createCheck.error.detail}
                    {createCheck.error.status === 429 && createCheck.error.retryAfterSeconds
                      ? ` (Rate limit active: retry in ~${Math.ceil(createCheck.error.retryAfterSeconds / 60)} min)`
                      : ""}
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Quick Interactive Samples */}
          <div className="mt-7 border-t border-border/70 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Explore real investigation samples
              </span>
              <span className="text-[11px] text-muted-foreground">Click to load</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleApplySample(sample)}
                  className="group flex flex-col items-start rounded-xl border border-border/80 bg-muted/30 p-3 text-left transition-all hover:border-blue-500/50 hover:bg-muted/70 hover:shadow-2xs"
                >
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider">
                    {sample.category}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {sample.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                    {sample.content}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Journalism & Verification Pillar Badges */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-2xs backdrop-blur-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Accredited Fact-Checks
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Direct integration with the Google Fact Check Tools API covering PolitiFact, AFP,
              FactCheck.org, and signatories of the IFCN code of principles.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-2xs backdrop-blur-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Live Web Grounding</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Gemini 3.8 Flash decomposes multi-part assertions, checks for manipulated context or
              logical fallacies, and links live primary sources.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-2xs backdrop-blur-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Zero Retention & Privacy
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              No account, no tracking cookies, and no IP address logs. Sliding-window rate limits
              use in-memory salted SHA-256 hashes that reset per boot.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

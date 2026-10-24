import { useState, useRef, useEffect, type SyntheticEvent } from "react";
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
  Loader2,
  AlertCircle,
  Clipboard,
  Trash2,
  CheckCircle2,
} from "lucide-react";

type InputMode = "text" | "url" | "images";

const MIN_LENGTH = 20;
const MAX_LENGTH = 20000;

export default function CheckPage() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const createCheck = useCreateCheck();

  useEffect(() => {
    if (!createCheck.isPending) {
      return;
    }
    const timer = setTimeout(() => setIsColdStarting(true), 4000);
    return () => {
      clearTimeout(timer);
      setIsColdStarting(false);
    };
  }, [createCheck.isPending]);

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
                <label htmlFor="claim-text" className="block text-xs font-semibold text-foreground">
                  Statement or Claim Text
                </label>
                <div className="relative">
                  <Textarea
                    id="claim-text"
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
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="article-url"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Article URL
                  </label>
                  <input
                    id="article-url"
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="url-context"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Additional Context{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <Textarea
                    id="url-context"
                    aria-label="Additional context (optional)"
                    placeholder="Optional: add specific context, timestamp, or particular claim to inspect within this article…"
                    rows={3}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="rounded-2xl border-border/80 bg-background text-sm leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Mode: IMAGES */}
            {mode === "images" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Screenshots{" "}
                    <span className="font-normal text-muted-foreground">(up to 4 images)</span>
                  </label>
                  <ImageDropzone files={images} onChange={setImages} />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="images-context"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Additional Context{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <Textarea
                    id="images-context"
                    aria-label="Additional context (optional)"
                    placeholder="Optional: add context about the screenshot(s), e.g., platform, viral date, or claimant…"
                    rows={3}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="rounded-2xl border-border/80 bg-background text-sm leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Form Submission Footer */}
            <div className="flex flex-col items-center justify-center gap-2 pt-2">
              <Button
                type="submit"
                disabled={!canSubmit || createCheck.isPending}
                size="lg"
                className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50 sm:w-auto"
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
              {isColdStarting && (
                <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>Waking up cloud backend (Render free tier cold start takes ~35–45s)…</span>
                </p>
              )}
            </div>

            {/* Error Banner */}
            {createCheck.error instanceof ApiError &&
              (() => {
                const detail = createCheck.error.detail || "";
                const isTimeout =
                  detail.toLowerCase().includes("timeout") ||
                  createCheck.error.status === 504 ||
                  createCheck.error.status === 502;
                return (
                  <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {isTimeout ? "Cloud server warming up" : "Unable to process check"}
                        </p>
                        <p className="mt-0.5 text-xs text-destructive/90">
                          {isTimeout
                            ? "The cloud server was sleeping (Render free tier cold start). It is now online! Please click 'Retry now' to submit."
                            : detail}
                          {createCheck.error.status === 429 && createCheck.error.retryAfterSeconds
                            ? ` (Rate limit active: retry in ~${Math.ceil(createCheck.error.retryAfterSeconds / 60)} min)`
                            : ""}
                        </p>
                      </div>
                    </div>
                    {isTimeout && (
                      <button
                        type="submit"
                        className="shrink-0 rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-destructive/90 cursor-pointer"
                      >
                        Retry now
                      </button>
                    )}
                  </div>
                );
              })()}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "@/api/axios-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCheck } from "../api/check-api";
import { ImageDropzone } from "../components/ImageDropzone";

type InputMode = "text" | "url" | "images";

const MIN_LENGTH = 20;
const MAX_LENGTH = 20000;

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

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">VeryFact</h1>
        <p className="text-muted-foreground">
          Check news articles, links, or social media screenshots against trusted sources.
        </p>
      </header>

      <div role="tablist" aria-label="Input type" className="flex gap-2 border-b pb-2">
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "text"}
          variant={mode === "text" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("text")}
        >
          Text
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "url"}
          variant={mode === "url" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("url")}
        >
          Article URL
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "images"}
          variant={mode === "images" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("images")}
        >
          Images / Screenshots
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "text" && (
          <Textarea
            aria-label="Article or claim text"
            placeholder="Paste the text you want to fact-check…"
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        )}

        {mode === "url" && (
          <div className="space-y-3">
            <input
              type="url"
              aria-label="Article URL"
              placeholder="https://example.com/news-article"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Textarea
              aria-label="Additional context (optional)"
              placeholder="Optional: specific claim or context about this link…"
              rows={4}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        )}

        {mode === "images" && (
          <div className="space-y-3">
            <ImageDropzone files={images} onChange={setImages} />
            <Textarea
              aria-label="Additional context (optional)"
              placeholder="Optional: context about the uploaded screenshot(s)…"
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {mode === "text"
              ? `${trimmedLength} / ${MAX_LENGTH}`
              : mode === "url"
                ? "Public http/https article link"
                : `${images.length} / 4 images selected`}
          </span>
          <Button type="submit" disabled={!canSubmit || createCheck.isPending}>
            {createCheck.isPending ? "Submitting…" : "Check facts"}
          </Button>
        </div>

        {createCheck.error instanceof ApiError && (
          <p role="alert" className="text-sm text-red-600">
            {createCheck.error.detail}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          AI-assisted verification can make mistakes. Always review the cited primary sources.
        </p>
      </form>
    </main>
  );
}

import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/api/axios-client";
import { useCreateCheck } from "../api/check-api";

const MIN_LENGTH = 20;
const MAX_LENGTH = 20000;

export default function CheckPage() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const createCheck = useCreateCheck();

  const trimmedLength = text.trim().length;
  const canSubmit = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH;

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    createCheck.mutate(
      { text },
      {
        onSuccess: (data) => {
          if (data.slug) navigate(`/r/${data.slug}`);
        },
      },
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">VeryFact</h1>
        <p className="text-muted-foreground">
          Paste a news article or claim and we'll check it against trusted sources.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          aria-label="Article or claim text"
          placeholder="Paste the text you want to fact-check…"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {trimmedLength} / {MAX_LENGTH}
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
      </form>
    </main>
  );
}

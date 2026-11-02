import { useState, useEffect, useRef, type SyntheticEvent, type KeyboardEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/api/axios-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCheck, useRecentChecks } from "../api/check-api";
import { ImageDropzone } from "../components/ImageDropzone";
import { VerdictBadge } from "../components/VerdictBadge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  FileText,
  Link2,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

type InputMode = "text" | "url" | "images";
const modes = [
  { key: "text", icon: FileText },
  { key: "url", icon: Link2 },
  { key: "images", icon: ImageIcon },
] as const;

export default function CheckPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSlow, setIsSlow] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const createCheck = useCreateCheck();
  const { data: recentChecks } = useRecentChecks();
  useEffect(() => {
    if (location.hash === "#how-it-works")
      document.getElementById("how-it-works")?.scrollIntoView();
  }, [location]);
  useEffect(() => {
    if (!createCheck.isPending) return;
    const timer = window.setTimeout(() => setIsSlow(true), 4000);
    return () => {
      window.clearTimeout(timer);
      setIsSlow(false);
    };
  }, [createCheck.isPending]);
  const trimmedLength = text.trim().length;
  let validUrl = false;
  try {
    validUrl = ["http:", "https:"].includes(new URL(url.trim()).protocol);
  } catch {
    /* Incomplete URL */
  }
  const canSubmit =
    mode === "text"
      ? trimmedLength >= 20 && text.length <= 20000
      : (mode === "url" ? validUrl : images.length > 0) && context.length <= 20000;
  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || createCheck.isPending) return;
    createCheck.mutate(
      mode === "text"
        ? { text }
        : mode === "url"
          ? { url: url.trim(), text: context || undefined }
          : { images, text: context || undefined },
      {
        onSuccess: (data) => {
          if (data.slug) navigate(`/r/${data.slug}`);
        },
      },
    );
  }
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % modes.length;
    else if (event.key === "ArrowLeft") next = (index + modes.length - 1) % modes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = modes.length - 1;
    else return;
    event.preventDefault();
    setMode(modes[next].key);
    tabRefs.current[next]?.focus();
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="home-main">
        <div className="home-focus">
          <section className="hero" aria-labelledby="hero-heading">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 id="hero-heading">
              {t("headline")}
              <br />
              <span>{t("headlineAccent")}</span>
            </h1>
            <p className="hero-description">{t("intro")}</p>
          </section>
          <section className="check-console" aria-label={t("claimLabel")}>
            <div role="tablist" aria-label={t("inputType")} className="input-tabs">
              {modes.map(({ key, icon: Icon }, index) => (
                <button
                  key={key}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-controls="input-panel"
                  aria-selected={mode === key}
                  tabIndex={mode === key ? 0 : -1}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  onClick={() => {
                    setMode(key);
                    createCheck.reset();
                  }}
                >
                  <Icon aria-hidden="true" size={17} />
                  {t(key)}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="check-form">
              <div role="tabpanel" id="input-panel" aria-labelledby={`tab-${mode}`}>
                {mode === "text" ? (
                  <>
                    <label htmlFor="claim-text" className="field-label">
                      {t("claimLabel")}
                    </label>
                    <Textarea
                      id="claim-text"
                      aria-label={t("claimAccessible")}
                      aria-describedby="text-hint"
                      placeholder={t("placeholder")}
                      value={text}
                      maxLength={20000}
                      onChange={(event) => setText(event.target.value)}
                      className="claim-input"
                    />
                    <div id="text-hint" className="input-meta">
                      <span>
                        {trimmedLength < 20
                          ? t("minimum")
                          : t("count", { count: text.length.toLocaleString() })}
                      </span>
                      {text && (
                        <button type="button" onClick={() => setText("")}>
                          {t("clear")}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {mode === "url" ? (
                      <>
                        <label htmlFor="article-url" className="field-label">
                          {t("url")}
                        </label>
                        <input
                          id="article-url"
                          type="url"
                          placeholder={t("urlPlaceholder")}
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                          className="url-input"
                        />
                      </>
                    ) : (
                      <ImageDropzone files={images} onChange={setImages} />
                    )}
                    <details className="context-disclosure">
                      <summary>{t("context")}</summary>
                      <label htmlFor="context" className="sr-only">
                        {t("context")}
                      </label>
                      <Textarea
                        id="context"
                        value={context}
                        maxLength={20000}
                        onChange={(event) => setContext(event.target.value)}
                        placeholder={t("contextPlaceholder")}
                        className="mt-3 min-h-24 text-base"
                      />
                    </details>
                  </>
                )}
              </div>
              <div className="submit-row">
                <p>{t("publicNote")}</p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit || createCheck.isPending}
                  className="submit-button"
                >
                  {createCheck.isPending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : null}
                  {t(createCheck.isPending ? "submitting" : "submit")}
                  {!createCheck.isPending && <ArrowRight aria-hidden="true" size={17} />}
                </Button>
              </div>
              {isSlow && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t("waiting")}
                </p>
              )}
              {createCheck.error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
                >
                  {createCheck.error instanceof ApiError && createCheck.error.status === 429
                    ? t("rateLimit", {
                        minutes: Math.max(
                          1,
                          Math.ceil((createCheck.error.retryAfterSeconds ?? 60) / 60),
                        ),
                      })
                    : t("error")}
                </p>
              )}
            </form>
          </section>
        </div>
        {recentChecks && recentChecks.length > 0 && (
          <section className="recent-section" aria-labelledby="recent-heading">
            <h2 id="recent-heading">{t("recent")}</h2>
            <div className="recent-grid">
              {recentChecks.slice(0, 3).map((check) => (
                <Link key={check.slug} to={`/r/${check.slug}`} className="recent-card">
                  <VerdictBadge verdict={check.overallVerdict} />
                  <p>{check.inputExcerpt || check.summary || t("reportFallback")}</p>
                  <span>
                    {t("report")}
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
          <h2 id="how-heading">{t("howTitle")}</h2>
          <div className="how-grid">
            {[1, 2, 3].map((number) => (
              <div key={number}>
                <span className="step-number">{number}</span>
                <h3>{t(`step${number}`)}</h3>
                <p>{t(`detail${number}`)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import "@/lib/i18n";
export function ShareButton() {
  const { t } = useTranslation();
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function handleCopy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
    }
  }
  return (
    <div className="share-control">
      <Button type="button" variant="outline" onClick={handleCopy} className="report-action">
        {state === "copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Share2 size={16} aria-hidden="true" />
        )}
        <span>{t(`result.${state === "copied" ? "copied" : "share"}`)}</span>
      </Button>
      <span role="status" className={state === "error" ? "share-error" : "sr-only"}>
        {state === "error" ? t("result.copyError") : state === "copied" ? t("result.copied") : ""}
      </span>
    </div>
  );
}

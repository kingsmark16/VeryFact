import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border-border/80 shadow-xs transition-all hover:bg-muted"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-700 dark:text-emerald-400">Copied link!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <span>Share result</span>
        </>
      )}
    </Button>
  );
}

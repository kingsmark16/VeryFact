import { Shield, Lock, EyeOff } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-foreground/70" />
            <span>Zero login required</span>
          </div>
          <span className="hidden text-border sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <EyeOff className="h-3.5 w-3.5 text-foreground/70" />
            <span>Ephemeral IP hashing</span>
          </div>
          <span className="hidden text-border sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-foreground/70" />
            <span>Google Fact Check Tools & Grounded Search</span>
          </div>
        </div>

        <p className="text-center">
          AI-assisted verification can make mistakes. Always inspect cited primary sources.
        </p>
      </div>
    </footer>
  );
}

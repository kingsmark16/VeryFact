import { Link } from "react-router";
import { ExternalLink } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <img
            src="/Icon.png"
            alt="VeryFact logo"
            className="h-9 w-9 rounded-xl object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">VeryFact</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                v1.0
              </span>
            </div>
            <span className="hidden text-[11px] text-muted-foreground sm:inline-block">
              Public Fact-Checking Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/kingsmark16/VeryFact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>
    </header>
  );
}

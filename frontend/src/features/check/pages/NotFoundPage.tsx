import { Link } from "react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Page not found
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to VeryFact</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link to="/" className="underline">
        Back to VeryFact
      </Link>
    </main>
  );
}

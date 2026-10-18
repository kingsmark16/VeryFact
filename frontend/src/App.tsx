import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">VeryFact</h1>
      <p className="text-muted-foreground">Check if a news article is real. Coming soon.</p>
      <Button>Check an article</Button>
    </main>
  );
}

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClaimCard } from "./ClaimCard";

describe("ClaimCard", () => {
  it("renders confidence, professional fact-checks, and filters unsafe source URLs", () => {
    render(
      <ClaimCard
        claim={{
          claim: "Drinking 5 liters of coffee daily makes you immortal.",
          verdict: "FALSE",
          confidence: 0.92,
          explanation: "High caffeine intake is dangerous.",
          sources: [
            { title: "WHO Guidelines", url: "https://www.who.int/news", publisher: "WHO" },
            { title: "Unsafe Link", url: "javascript:alert(1)", publisher: "Attacker" },
          ],
          factChecks: [
            {
              claimText: "Coffee makes you immortal",
              claimant: "Viral blog",
              publisher: "Vera Files",
              title: "Fact Check: Coffee does not grant immortality",
              url: "https://verafiles.org/articles/coffee-check",
              textualRating: "False",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("92% confidence")).toBeInTheDocument();
    expect(screen.getByText("Professional Fact-Checks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Fact Check: Coffee does not grant immortality/i }),
    ).toHaveAttribute("href", "https://verafiles.org/articles/coffee-check");
    expect(screen.getByRole("link", { name: "WHO Guidelines" })).toBeInTheDocument();
    expect(screen.queryByText("Unsafe Link")).not.toBeInTheDocument();
  });
});

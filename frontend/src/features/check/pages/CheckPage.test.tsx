import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import CheckPage from "./CheckPage";

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CheckPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CheckPage", () => {
  it("disables submit until the text is long enough", async () => {
    renderPage();
    const button = screen.getByRole("button", { name: /check facts/i });
    expect(button).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/article or claim text/i),
      "The moon is made of green cheese, scientists say.",
    );
    expect(button).toBeEnabled();
  });
  it("switches to Article URL tab and enables submit for valid https URL", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: /article url/i }));

    const button = screen.getByRole("button", { name: /check facts/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/article url/i), "https://example.com/news/story");
    expect(button).toBeEnabled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/api/axios-client";
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

    await userEvent.type(
      screen.getByRole("textbox", { name: /article url/i }),
      "https://example.com/news/story",
    );
    expect(button).toBeEnabled();
  });

  it("supports arrow keys and a single tab stop in the input tabs", async () => {
    renderPage();
    const textTab = screen.getByRole("tab", { name: "Text" });
    textTab.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Article URL" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Article URL" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(textTab).toHaveAttribute("tabindex", "-1");
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Screenshots" })).toHaveFocus();
  });

  it("keeps claim text out of optional article context", async () => {
    renderPage();
    await userEvent.type(
      screen.getByLabelText(/article or claim text/i),
      "A claim that should stay in the text tab.",
    );
    await userEvent.click(screen.getByRole("tab", { name: /article url/i }));
    expect(screen.getByLabelText(/add context/i)).toHaveValue("");
    await userEvent.click(screen.getByRole("tab", { name: "Text" }));
    expect(screen.getByLabelText(/article or claim text/i)).toHaveValue(
      "A claim that should stay in the text tab.",
    );
  });

  it("rejects a URL without a hostname", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: /article url/i }));
    await userEvent.type(screen.getByRole("textbox", { name: /article url/i }), "https://");
    expect(screen.getByRole("button", { name: /check facts/i })).toBeDisabled();
  });

  it("renders recent checks when available", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValueOnce({
      data: [
        {
          slug: "test-slug-1",
          inputType: "TEXT",
          inputExcerpt: "Recent claim excerpt about green cheese",
          overallVerdict: "FALSE",
          confidence: 0.95,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    renderPage();

    expect(await screen.findByText(/recent claim excerpt about green cheese/i)).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });
});

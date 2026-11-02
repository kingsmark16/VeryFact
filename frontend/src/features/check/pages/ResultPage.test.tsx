import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCheckResult, type CheckResult } from "../api/check-api";
import ResultPage from "./ResultPage";
vi.mock("../api/check-api", () => ({ useCheckResult: vi.fn() }));
const report: CheckResult = {
  status: "COMPLETED",
  overallVerdict: "MIXED",
  confidence: 0.7,
  summary: "Some claims have support; others need context.",
  claims: [
    {
      claim: "Supported claim",
      verdict: "TRUE",
      explanation: "Confirmed by source.",
      sources: [{ title: "Shared report", url: "https://example.com/report" }],
    },
    {
      claim: "Disputed claim",
      verdict: "FALSE",
      explanation: "Contradicted by source.",
      sources: [{ title: "Shared report", url: "https://example.com/report" }],
    },
    {
      claim: "Uncertain claim",
      verdict: "UNVERIFIABLE",
      explanation: "Not enough evidence.",
      sources: [],
    },
  ],
};
function setResult(data: CheckResult | undefined, isPending = false) {
  vi.mocked(useCheckResult).mockReturnValue({
    data,
    isPending,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useCheckResult>);
}
function Page() {
  return (
    <MemoryRouter initialEntries={["/r/test"]}>
      <Routes>
        <Route path="/r/:slug" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>
  );
}
beforeEach(() => {
  setResult(report);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.mocked(window.scrollTo).mockClear();
});
describe("ResultPage", () => {
  it("filters all verdict categories and counts unique cited sources", async () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: "Mixed" })).toBeVisible();
    expect(within(screen.getByLabelText("At a glance")).getByText("1")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /uncertain\s*1/i }));
    expect(screen.getByRole("heading", { name: "Uncertain claim" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Supported claim" })).not.toBeInTheDocument();
    expect(screen.getByText(/No supporting links were provided/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /disputed\s*1/i }));
    expect(screen.getByRole("heading", { name: "Disputed claim" })).toBeVisible();
  });
  it("opens the finished report at the top and focuses the verdict without scrolling it into the middle", () => {
    setResult({ status: "PROCESSING", stage: "VERIFYING_CLAIMS" });
    const view = render(<Page />);
    expect(screen.getByRole("status", { name: "Live verification" })).toHaveTextContent(
      "Searching and evaluating evidence",
    );
    expect(window.scrollTo).not.toHaveBeenCalled();
    setResult(report);
    view.rerender(<Page />);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    expect(screen.getByRole("heading", { name: "Mixed" })).toHaveFocus();
    expect(screen.queryByRole("heading", { name: "Checking the facts." })).not.toBeInTheDocument();
  });
  it("scrolls to the top when an opening request immediately returns a completed report", () => {
    setResult(undefined, true);
    const view = render(<Page />);
    setResult(report);
    view.rerender(<Page />);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  });
  it("does not reset the reader's position for filters or a completed-report refresh", async () => {
    const view = render(<Page />);
    vi.mocked(window.scrollTo).mockClear();
    await userEvent.click(screen.getByRole("button", { name: /uncertain\s*1/i }));
    setResult({ ...report, summary: "Updated report summary." });
    view.rerender(<Page />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it("shows a real failure and an escape action without a verdict", () => {
    setResult({ status: "FAILED", errorMessage: "The provider is unavailable." });
    render(<Page />);
    expect(screen.getByRole("alert")).toHaveTextContent("The provider is unavailable.");
    expect(screen.getByRole("link", { name: "Check something else" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { name: "Mixed" })).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProgressSteps } from "./ProgressSteps";

describe("ProgressSteps", () => {
  it("shows only the reported activity without a step list or fabricated percentage", () => {
    render(<ProgressSteps stage="VERIFYING_CLAIMS" />);
    expect(screen.getByRole("status")).toHaveTextContent("Searching and evaluating evidence");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByText(/Stage \d+ of/)).not.toBeInTheDocument();
  });
  it("updates the activity from the server while animation is paused", async () => {
    const view = render(<ProgressSteps stage="EXTRACTING_CLAIMS" />);
    expect(screen.getByRole("status")).toHaveTextContent("Finding the claims");
    await userEvent.click(screen.getByRole("button", { name: "Pause animation" }));
    expect(screen.getByRole("button", { name: "Resume animation" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    view.rerender(<ProgressSteps stage="SEARCHING_FACT_CHECKS" />);
    expect(screen.getByRole("status")).toHaveTextContent("Finding fact-checks");
    expect(screen.getByRole("button", { name: "Resume animation" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("does not invent activity before the server reports a known stage", () => {
    render(<ProgressSteps stage="UNKNOWN" />);
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for an update");
  });
  it("shows retrieval status while opening an existing report", () => {
    render(<ProgressSteps opening />);
    expect(screen.getByRole("status")).toHaveTextContent("Opening your report");
    expect(screen.queryByText("Getting started")).not.toBeInTheDocument();
  });
});

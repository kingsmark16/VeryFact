import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

describe("ShareButton", () => {
  it("confirms a successful copy only after the clipboard operation succeeds", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<ShareButton />);
    await user.click(screen.getByRole("button", { name: "Share report" }));
    expect(screen.getByRole("button", { name: "Link copied" })).toBeVisible();
  });
  it("offers a fallback if clipboard permission is denied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Permission denied"));
    render(<ShareButton />);
    await user.click(screen.getByRole("button", { name: "Share report" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copy the address from your browser.");
    expect(screen.queryByRole("button", { name: "Link copied" })).not.toBeInTheDocument();
  });
});

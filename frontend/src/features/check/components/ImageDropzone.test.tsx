import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageDropzone } from "./ImageDropzone";

afterEach(() => vi.unstubAllGlobals());

describe("ImageDropzone", () => {
  it("announces the file limit and keeps only four images", () => {
    const onChange = vi.fn();
    render(<ImageDropzone files={[]} onChange={onChange} />);
    const files = Array.from(
      { length: 5 },
      (_, index) => new File(["image"], `${index}.png`, { type: "image/png" }),
    );
    fireEvent.change(screen.getByLabelText("Choose images"), { target: { files } });
    expect(screen.getByRole("alert")).toHaveTextContent("You can add up to 4 images.");
    expect(onChange).toHaveBeenCalledWith(files.slice(0, 4));
  });

  it("rejects an unsupported upload with a recoverable message", () => {
    const onChange = vi.fn();
    render(<ImageDropzone files={[]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [new File(["document"], "notes.pdf", { type: "application/pdf" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "notes.pdf: choose a JPG, PNG, or WebP image.",
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /choose images/i })).toBeEnabled();
  });
});

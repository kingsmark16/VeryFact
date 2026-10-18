import { useRef, type ChangeEvent, type ClipboardEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageDropzoneProps {
  files: File[];
  onChange: (nextFiles: File[]) => void;
}

export function ImageDropzone({ files, onChange }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function appendValidFiles(incoming: FileList | File[]) {
    const valid = Array.from(incoming).filter((file) => ALLOWED_TYPES.includes(file.type));
    if (valid.length === 0) return;
    const merged = [...files, ...valid].slice(0, MAX_FILES);
    onChange(merged);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      appendValidFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.dataTransfer.files) {
      appendValidFiles(event.dataTransfer.files);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (event.clipboardData.files && event.clipboardData.files.length > 0) {
      appendValidFiles(event.clipboardData.files);
    }
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className="space-y-3 rounded-lg border-2 border-dashed p-6 text-center focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        aria-label="Upload images"
        onChange={handleFileChange}
      />
      <p className="text-sm text-muted-foreground">
        Drag & drop screenshots here, press <kbd className="rounded border px-1">Ctrl+V</kbd> to
        paste, or
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={files.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
      >
        Choose images ({files.length}/{MAX_FILES})
      </Button>
      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP · Max 5 MB each</p>

      {files.length > 0 && (
        <ul className="space-y-1.5 pt-2 text-left text-sm">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between rounded border px-3 py-1.5"
            >
              <span className="truncate">
                {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useRef, type ChangeEvent, type ClipboardEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";

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
      className="group relative space-y-3 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-all hover:border-blue-500/60 hover:bg-muted/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-105 dark:text-blue-400">
        <UploadCloud className="h-6 w-6" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Drag & drop screenshots here, press{" "}
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-mono shadow-xs">
            Ctrl+V
          </kbd>{" "}
          to paste, or
        </p>
        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP · Max 5 MB each</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={files.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        className="gap-1.5 shadow-xs"
      >
        <ImageIcon className="h-4 w-4" />
        <span>
          Choose images ({files.length}/{MAX_FILES})
        </span>
      </Button>

      {files.length > 0 && (
        <ul className="space-y-2 pt-3 text-left text-sm">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-border/80 bg-background/80 px-3.5 py-2 shadow-xs backdrop-blur-xs"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <ImageIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate font-medium text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ({Math.max(1, Math.round(file.size / 1024))} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${file.name}`}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

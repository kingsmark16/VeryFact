import {
  useRef,
  useState,
  useMemo,
  useEffect,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";

const MAX_FILES = 4;
const MAX_BYTES_PER_FILE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageDropzoneProps {
  files: File[];
  onChange: (nextFiles: File[]) => void;
}

export function ImageDropzone({ files, onChange }: ImageDropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate object URLs for rich visual thumbnail previews
  const filePreviews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [filePreviews]);

  function appendValidFiles(incoming: FileList | File[]) {
    setErrorMessage(null);
    const valid: File[] = [];

    for (const file of Array.from(incoming)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMessage(t("fileTypeError", { name: file.name }));
        continue;
      }
      if (file.size > MAX_BYTES_PER_FILE) {
        setErrorMessage(t("fileSizeError", { name: file.name }));
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;
    if (files.length + valid.length > MAX_FILES) setErrorMessage(t("fileCountError"));
    const merged = [...files, ...valid].slice(0, MAX_FILES);
    onChange(merged);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      appendValidFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
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
    setErrorMessage(null);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
          isDragging
            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30"
            : "border-border/80 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40"
        } focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          aria-label={t("choose")}
          onChange={handleFileChange}
        />

        <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-transform duration-200 group-hover:scale-110 dark:text-blue-400">
          <UploadCloud aria-hidden="true" className="h-6 w-6" />
        </div>

        <p className="text-sm font-medium">{t("upload")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("uploadHint")}</p>
        <Button
          type="button"
          variant="outline"
          disabled={files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="mt-4 min-h-11 rounded-lg"
        >
          {t("choose")} ({files.length}/{MAX_FILES})
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">{t("fileLimits")}</p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs text-destructive"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="group/thumb relative overflow-hidden rounded-xl border border-border/80 bg-card p-2 shadow-2xs transition-all hover:border-blue-500/40 hover:shadow-sm"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                {filePreviews[idx] ? (
                  <img
                    src={filePreviews[idx]}
                    alt={file.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={t("remove", { name: file.name })}
                  className="absolute top-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white opacity-90 backdrop-blur-xs transition-opacity hover:bg-black hover:opacity-100"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2 space-y-0.5 px-0.5 text-left">
                <p className="truncate text-xs font-medium text-foreground" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

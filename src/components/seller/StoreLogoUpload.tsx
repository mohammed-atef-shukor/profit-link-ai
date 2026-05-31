import { useRef, useState, type DragEvent } from "react";
import { AlertTriangle, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { validateLogoFile } from "@/firebase/storage";

type StoreLogoUploadProps = {
  logoUrl: string | null;
  uploading?: boolean;
  uploadProgress?: number | null;
  removing?: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
};

export function StoreLogoUpload({
  logoUrl,
  uploading = false,
  uploadProgress = null,
  removing = false,
  onUpload,
  onRemove,
}: StoreLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; sizeLabel: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const busy = uploading || removing;
  const hasLogo = Boolean(logoUrl);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file: File | null) => {
    if (!file || busy) return;
    try {
      validateLogoFile(file);
      setError(null);
      setSelectedFileMeta({ name: file.name, sizeLabel: formatSize(file.size) });
      void onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid logo file");
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!busy) setDragOver(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const requestRemove = async () => {
    if (busy) return;
    setSelectedFileMeta(null);
    await onRemove();
    setConfirmOpen(false);
  };

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

  return (
    <div className="grid gap-4">
      <div
        onDragOver={hasLogo ? onDragOver : undefined}
        onDragLeave={hasLogo ? onDragLeave : undefined}
        onDrop={hasLogo ? onDrop : undefined}
        className={`rounded-2xl border border-border bg-muted/20 p-4 transition-all duration-200 sm:p-5 ${
          hasLogo && dragOver ? "border-primary bg-primary/5 shadow-sm" : ""
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="shrink-0">
            {hasLogo ? (
              <button
                type="button"
                onClick={openPicker}
                disabled={busy}
                className="group relative block size-24 overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:border-primary/50 sm:size-28"
                aria-label="Change store logo"
              >
                <img src={logoUrl ?? ""} alt="Store logo preview" className="size-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-background/0 text-xs font-medium opacity-0 transition-all group-hover:bg-background/45 group-hover:opacity-100">
                  Change
                </span>
              </button>
            ) : (
              <div className="grid size-24 place-items-center rounded-2xl border border-dashed border-border bg-surface sm:size-28">
                <ImagePlus className="size-7 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <p className="font-medium leading-none">
              {hasLogo ? "Store logo" : "Upload a logo to personalize your storefront"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP • Max 5MB • Recommended 512 x 512</p>
            {selectedFileMeta ? (
              <p className="truncate text-xs text-muted-foreground">
                {selectedFileMeta.name} • {selectedFileMeta.sizeLabel}
              </p>
            ) : hasLogo ? (
              <p className="text-xs text-muted-foreground">Drag and drop a new image onto the logo to replace it.</p>
            ) : null}
          </div>
        </div>
        {!hasLogo && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`mt-4 rounded-xl border border-dashed bg-surface p-4 text-center transition-all duration-200 ${
              dragOver
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/40"
            } ${busy ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload store logo"
          >
            <div className="flex flex-col items-center gap-2">
              {busy ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">Drag & drop your logo here</p>
              <p className="text-xs text-muted-foreground">or click to upload</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {uploadProgress != null && uploadProgress < 100 && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        {hasLogo && (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={openPicker}>
            Change Logo
          </Button>
        )}
        {hasLogo && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Remove
          </button>
        )}
        {busy && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {uploading ? "Uploading logo..." : "Removing logo..."}
          </span>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(next) => !busy && setConfirmOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader className="space-y-3">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle>Remove store logo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your logo from your storefront. You can upload a new one at any time.
            </AlertDialogDescription>
            {logoUrl ? (
              <div className="mt-2 inline-flex size-14 overflow-hidden rounded-lg border border-border bg-muted/30">
                <img src={logoUrl} alt="Current store logo" className="size-full object-cover" />
              </div>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void requestRemove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {removing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Removing...
                </span>
              ) : (
                "Remove Logo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatar, AvatarUploadError } from "@/lib/profile-service";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  /** Current Supabase user id — used as the storage folder. */
  userId: string;
  /** Current avatar URL (if any). */
  value?: string;
  /** Display fallback initial when no avatar is set. */
  fallbackText?: string;
  /** Called when an upload succeeds with the new public URL. */
  onUploaded: (url: string) => void;
  /** Called when the user clears the avatar. */
  onCleared?: () => void;
  /** Optional caption shown below the avatar. */
  caption?: string;
  /** Disable the uploader (e.g., before user is authenticated). */
  disabled?: boolean;
  className?: string;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

export function AvatarUploader({
  userId,
  value,
  fallbackText,
  onUploaded,
  onCleared,
  caption,
  disabled,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  function pickFile() {
    if (disabled || isUploading) return;
    setError(null);
    inputRef.current?.click();
  }

  async function performUpload(file: File) {
    setIsUploading(true);
    setError(null);
    setLastFile(file);
    try {
      const { publicUrl } = await uploadAvatar(userId, file);
      onUploaded(publicUrl);
    } catch (err) {
      const message =
        err instanceof AvatarUploadError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erreur inconnue lors de l'upload de l'image.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so the user can re-pick the same file after a failure.
    event.target.value = "";
    if (!file) return;
    void performUpload(file);
  }

  function handleRetry() {
    if (lastFile) {
      void performUpload(lastFile);
    } else {
      pickFile();
    }
  }

  function handleClear() {
    if (disabled || isUploading) return;
    setError(null);
    setLastFile(null);
    onCleared?.();
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <Avatar
          className={cn(
            "h-24 w-24 border-2 transition-all",
            value
              ? "border-primary/40 shadow-[0_0_18px_rgba(78,222,163,0.18)]"
              : "border-white/15 bg-white/5"
          )}
        >
          {value && <AvatarImage src={value} alt="Avatar" />}
          <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
            {fallbackText?.charAt(0)?.toUpperCase() || (
              <Camera className="h-8 w-8 text-muted-foreground/70" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Loader overlay during upload */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Edit pill */}
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || isUploading}
          aria-label="Modifier l'avatar"
          className={cn(
            "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-all",
            "hover:scale-105 hover:shadow-lg",
            (disabled || isUploading) && "cursor-not-allowed opacity-60"
          )}
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || isUploading}
      />

      {/* Caption + actions */}
      {caption && !error && (
        <p className="text-xs text-muted-foreground">{caption}</p>
      )}
      {!caption && !error && !isUploading && (
        <p className="text-[11px] text-muted-foreground">
          JPG, PNG, WebP ou GIF · max 2 Mo
        </p>
      )}

      {value && !error && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-white/5"
        >
          <Trash2 className="h-3 w-3" />
          Réinitialiser
        </Button>
      )}

      {/* Error UI with retry */}
      {error && (
        <div
          role="alert"
          className="flex w-full max-w-xs flex-col items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-center leading-tight">{error}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRetry}
            disabled={isUploading || disabled}
            className="h-6 gap-1 px-2 text-[11px] text-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}

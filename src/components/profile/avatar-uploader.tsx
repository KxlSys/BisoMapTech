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
    <div className={cn("flex flex-col items-center gap-3.5", className)}>
      {/* Interactive Avatar Container */}
      <div 
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label="Modifier la photo de profil"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFile();
          }
        }}
        className={cn(
          "group relative cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full",
          (disabled || isUploading) && "cursor-not-allowed pointer-events-none"
        )}
        onClick={pickFile}
      >
        {/* Sleek Gradient Glowing Halo on Hover */}
        <div className="absolute inset-0 -m-1.5 rounded-full bg-gradient-to-tr from-primary/30 to-tertiary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Double-Ring Border Container */}
        <div 
          className={cn(
            "relative h-28 w-28 rounded-full border p-1 transition-all duration-300",
            value 
              ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(78,222,163,0.15)]" 
              : "border-white/10 bg-white/3 group-hover:border-white/20"
          )}
        >
          <Avatar className="h-full w-full border border-white/5 overflow-hidden transition-all duration-300">
            {value && (
              <AvatarImage 
                src={value} 
                alt="Photo de profil" 
                className="object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            )}
            <AvatarFallback className="bg-white/5 text-primary text-3xl font-extrabold flex items-center justify-center select-none uppercase">
              {fallbackText?.slice(0, 2) || (
                <Camera className="h-7 w-7 text-muted-foreground/60" />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Interactive Floating Camera Indicator on Hover */}
          <div className="absolute inset-1 flex flex-col items-center justify-center rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold text-white/90 gap-1">
            <Camera className="h-4.5 w-4.5 text-primary animate-pulse" />
            <span>Modifier</span>
          </div>

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-1 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Small floating action trigger (always visible for visual affordance) */}
        {!isUploading && (
          <div 
            className={cn(
              "absolute bottom-0 right-0 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/10 bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110",
              disabled && "opacity-50"
            )}
          >
            <Camera className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || isUploading}
      />

      {/* Helper text / state info */}
      {!error && !isUploading && (
        <div className="text-center space-y-0.5">
          {caption ? (
            <p className="text-xs font-medium text-muted-foreground">{caption}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground/70">
              JPG, PNG, WebP ou GIF · max 2 Mo
            </p>
          )}
        </div>
      )}

      {value && !error && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          disabled={disabled}
          className="h-6.5 gap-1 px-2.5 text-[11px] rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Supprimer la photo
        </Button>
      )}

      {/* Error UI with elegant alert layout */}
      {error && (
        <div
          role="alert"
          className="flex w-full max-w-xs flex-col items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 shadow-lg shadow-destructive/5"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-center leading-snug">{error}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
            disabled={isUploading || disabled}
            className="h-6.5 gap-1 px-2.5 text-[11px] text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer l'upload
          </Button>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VoiceMessage — lecteur de note vocale moderne (style WhatsApp / Telegram).
 *
 * Autonome et réutilisable : il ne reçoit qu'une URL audio (déjà déchiffrée en
 * amont pour les messages E2EE) et s'adapte au fond de la bulle via `isMine`.
 *
 * Détails de conception :
 *  - La waveform est extraite des vraies amplitudes du fichier via la Web Audio API.
 *  - Le nombre de barres s'adapte à la largeur disponible (ResizeObserver) pour
 *    rester impeccable du mobile étroit au desktop.
 *  - La progression, la tête de lecture et le minuteur sont peints de façon
 *    IMPÉRATIVE (refs) dans une boucle requestAnimationFrame : aucun re-render
 *    React pendant la lecture.
 */

const BASE_PEAKS = 96; // résolution interne, rééchantillonnée à l'affichage
const MIN_BAR = 0.12; // hauteur plancher (silences visibles)
const BAR_PITCH = 4; // largeur barre + espace, en px (pour le calcul responsive)
const SPEEDS = [1, 1.5, 2] as const;

// Un seul message vocal joue à la fois : chaque instance s'arrête quand une
// autre démarre (coordination légère via un évènement global).
const PLAY_EVENT = "bisomap:voice-play";

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Waveform de repli crédible quand le décodage est impossible (Safari/webm, CORS). */
function fallbackPeaks(seed: number): number[] {
  const peaks: number[] = [];
  let x = seed || 1;
  for (let i = 0; i < BASE_PEAKS; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    const envelope = Math.sin((i / (BASE_PEAKS - 1)) * Math.PI); // fondu aux extrémités
    peaks.push(Math.max(MIN_BAR, (0.4 + r * 0.6) * envelope));
  }
  return peaks;
}

/** Réduit le signal décodé à BASE_PEAKS amplitudes normalisées (0..1). */
function computePeaks(buffer: AudioBuffer): number[] {
  const data = buffer.getChannelData(0);
  const block = Math.floor(data.length / BASE_PEAKS) || 1;
  const peaks: number[] = [];
  let max = 1e-4;
  for (let i = 0; i < BASE_PEAKS; i++) {
    const start = i * block;
    let peak = 0;
    for (let j = 0; j < block; j++) {
      const v = Math.abs(data[start + j] || 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  return peaks.map((p) => Math.max(MIN_BAR, p / max));
}

/** Rééchantillonne des pics vers `n` barres (max par tranche). */
function resample(src: number[], n: number): number[] {
  if (n <= 0) return [];
  if (src.length === n) return src;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor((i / n) * src.length);
    const end = Math.max(start + 1, Math.ceil(((i + 1) / n) * src.length));
    let peak = 0;
    for (let j = start; j < end && j < src.length; j++) {
      if (src[j] > peak) peak = src[j];
    }
    out.push(peak || MIN_BAR);
  }
  return out;
}

export interface VoiceMessageProps {
  /** URL audio prête à lire (blob: déchiffré ou URL publique). */
  src: string;
  /** Adapte la palette : message envoyé (bulle verte) vs reçu (bulle sombre). */
  isMine?: boolean;
  className?: string;
}

export function VoiceMessage({ src, isMine = false, className }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);
  const playedRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const instanceId = useRef(Math.random().toString(36).slice(2));

  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [barCount, setBarCount] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [decoding, setDecoding] = useState(true);

  const speed = SPEEDS[speedIdx];

  // ── Décodage : waveform réelle + durée fiable ─────────────────────────────
  useEffect(() => {
    let active = true;
    setDecoding(true);
    setPeaks(null);
    const seed = Array.from(src).reduce((a, ch) => a + ch.charCodeAt(0), 0);

    (async () => {
      try {
        const res = await fetch(src);
        const raw = await res.arrayBuffer();
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) throw new Error("no-audio-context");
        const ctx = new Ctx();
        const buffer = await ctx.decodeAudioData(raw);
        ctx.close();
        if (!active) return;
        setPeaks(computePeaks(buffer));
        if (isFinite(buffer.duration) && buffer.duration > 0) setDuration(buffer.duration);
      } catch {
        if (active) setPeaks(fallbackPeaks(seed));
      } finally {
        if (active) setDecoding(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [src]);

  // ── Nombre de barres adaptatif à la largeur disponible ─────────────────────
  useLayoutEffect(() => {
    const el = waveRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setBarCount(Math.max(14, Math.min(64, Math.floor(w / BAR_PITCH))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Peinture impérative (progression, tête, minuteur) sans re-render ───────
  const paint = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const total = duration || audio.duration;
    const hasTotal = total > 0 && isFinite(total);
    const ratio = hasTotal ? Math.min(1, audio.currentTime / total) : 0;

    if (playedRef.current) playedRef.current.style.clipPath = `inset(0 ${(1 - ratio) * 100}% 0 0)`;
    if (headRef.current) headRef.current.style.left = `${ratio * 100}%`;
    if (timeRef.current) {
      const showElapsed = !audio.paused || audio.currentTime > 0;
      timeRef.current.textContent = hasTotal
        ? formatTime(showElapsed ? audio.currentTime : total)
        : "--:--";
    }
    if (waveRef.current) {
      waveRef.current.setAttribute("aria-valuenow", String(Math.round(audio.currentTime)));
    }
  }, [duration]);

  const loop = useCallback(() => {
    paint();
    rafRef.current = requestAnimationFrame(loop);
  }, [paint]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(loop);
    } else if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, loop]);

  // Garde la peinture synchronisée après chaque re-render (durée connue, resize,
  // play/pause). useLayoutEffect corrige les styles avant le paint navigateur,
  // donc aucun scintillement même quand React réinitialise le style inline.
  useLayoutEffect(() => {
    paint();
  });

  // S'arrête si une autre note vocale démarre.
  useEffect(() => {
    function onOtherPlay(e: Event) {
      if ((e as CustomEvent<string>).detail !== instanceId.current) {
        audioRef.current?.pause();
      }
    }
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: instanceId.current }));
      audio.playbackRate = speed;
      setStarted(true);
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [speed]);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => {
      const next = (i + 1) % SPEEDS.length;
      if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
      return next;
    });
  }, []);

  const seekTo = useCallback(
    (clientX: number, el: HTMLElement) => {
      const audio = audioRef.current;
      const total = duration || audio?.duration || 0;
      if (!audio || !total || !isFinite(total)) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      audio.currentTime = ratio * total;
      paint();
    },
    [duration, paint]
  );

  const onWaveKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const audio = audioRef.current;
      const total = duration || audio?.duration || 0;
      if (!audio || !total) return;
      if (e.key === "ArrowRight") {
        audio.currentTime = Math.min(total, audio.currentTime + 5);
        paint();
      } else if (e.key === "ArrowLeft") {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
        paint();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        togglePlay();
      }
    },
    [duration, paint, togglePlay]
  );

  // Palette adaptée au fond de la bulle.
  const c = isMine
    ? {
        btn: "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25",
        base: "bg-primary-foreground/30",
        played: "bg-primary-foreground",
        head: "bg-primary-foreground",
        text: "text-primary-foreground/75",
        chip: "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25",
      }
    : {
        btn: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        base: "bg-white/20",
        played: "bg-primary",
        head: "bg-primary",
        text: "text-muted-foreground",
        chip: "bg-white/10 text-foreground hover:bg-white/20",
      };

  // Hauteurs (%) rééchantillonnées à la largeur courante.
  const barHeights = useMemo(
    () =>
      resample(peaks ?? Array<number>(BASE_PEAKS).fill(MIN_BAR), barCount).map(
        (p) => `${Math.round(p * 100)}%`
      ),
    [peaks, barCount]
  );

  const renderBars = (colorClass: string) =>
    barHeights.map((h, i) => (
      <span
        key={i}
        className={cn("min-w-[2px] flex-1 rounded-full transition-[height] duration-300 ease-out", colorClass)}
        style={{ height: h }}
      />
    ));

  const showSpeed = isPlaying || started;

  return (
    <div
      className={cn(
        "group/voice flex items-center gap-2.5 py-1 w-full min-w-[160px] max-w-[300px] select-none",
        className
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          const audio = audioRef.current;
          if (audio) audio.currentTime = 0;
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          audio.playbackRate = speed;
          // Les webm issus de MediaRecorder annoncent souvent duration=Infinity
          // tant qu'on n'a pas « parcouru » le fichier (bug connu Chrome).
          if (audio.duration === Infinity) {
            audio.currentTime = 1e101;
            const fix = () => {
              audio.removeEventListener("timeupdate", fix);
              audio.currentTime = 0;
            };
            audio.addEventListener("timeupdate", fix);
          }
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          setDuration((prev) => (prev > 0 ? prev : isFinite(d) && d > 0 ? d : prev));
        }}
      />

      {/* Bouton Play / Pause circulaire */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Lecture"}
        aria-pressed={isPlaying}
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
          c.btn
        )}
      >
        {decoding ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 translate-x-[1px]" />
        )}
      </button>

      {/* Waveform (centre) — cliquable / accessible au clavier */}
      <div
        ref={waveRef}
        role="slider"
        tabIndex={0}
        aria-label="Progression de la lecture"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={0}
        onKeyDown={onWaveKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seekTo(e.clientX, e.currentTarget);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) seekTo(e.clientX, e.currentTarget);
        }}
        className="relative h-9 flex-1 min-w-0 cursor-pointer touch-none overflow-hidden focus-visible:outline-none"
      >
        {/* Couche de base (non lue) */}
        <div className="absolute inset-0 flex items-center gap-[2px]">{renderBars(c.base)}</div>
        {/* Couche lue, révélée par clip-path mis à jour en rAF */}
        <div
          ref={playedRef}
          className="absolute inset-0 flex items-center gap-[2px]"
          style={{ clipPath: "inset(0 100% 0 0)" }}
        >
          {renderBars(c.played)}
        </div>
        {/* Tête de lecture lumineuse (visible et animée pendant la lecture) */}
        <div
          ref={headRef}
          className={cn(
            "pointer-events-none absolute top-1 bottom-1 w-[2px] -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-200",
            c.head,
            isPlaying && "opacity-100 motion-safe:animate-pulse"
          )}
          style={{ left: "0%" }}
        />
      </div>

      {/* Durée (droite) + vitesse */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span ref={timeRef} className={cn("text-[11px] font-semibold tabular-nums leading-none", c.text)}>
          --:--
        </span>
        {showSpeed && (
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={`Vitesse de lecture ${speed}×`}
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums leading-none backdrop-blur-sm transition-colors",
              c.chip
            )}
          >
            {speed}×
          </button>
        )}
      </div>
    </div>
  );
}

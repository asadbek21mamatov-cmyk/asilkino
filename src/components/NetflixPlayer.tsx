"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Tv,
  Loader2,
  ChevronLeft,
  Moon,
  Sun,
} from "lucide-react";

interface NetflixPlayerProps {
  src: string;
  poster?: string;
  title: string;
  studio?: string;
  autoPlay?: boolean;
  onBack?: () => void;
}

/* ---------- YouTube IFrame JS API loader (singleton) ---------- */
declare global {
  interface Window {
    YT?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Player: new (el: HTMLElement, opts: any) => any;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hls?: any;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

let hlsPromise: Promise<void> | null = null;
function loadHlsJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Hls) return Promise.resolve();
  if (hlsPromise) return hlsPromise;

  hlsPromise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("HLS yuklanmadi"));
    document.head.appendChild(tag);
  });
  return hlsPromise;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

function normalizeMediaSrc(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().includes("<iframe")) {
    const m = trimmed.match(/src=["']([^"']+)["']/i);
    if (m?.[1]) return m[1].trim();
  }
  return trimmed;
}

function detectSourceKind(src: string): "empty" | "youtube" | "hls" | "video" | "embed" {
  if (!src) return "empty";
  if (extractYouTubeId(src)) return "youtube";
  if (/\.m3u8(\?|$)/i.test(src)) return "hls";
  if (
    /\.(mp4|webm|ogg|mov|m4v|mkv)(\?|$)/i.test(src) ||
    src.includes("/storage/v1/object/public/") ||
    src.startsWith("blob:")
  ) {
    return "video";
  }
  return "embed";
}

export default function NetflixPlayer({
  src: rawSrc,
  poster,
  title,
  studio,
  autoPlay = false,
  onBack,
}: NetflixPlayerProps) {
  const src = normalizeMediaSrc(rawSrc);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytMountRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kind = detectSourceKind(src);
  const ytId = kind === "youtube" ? extractYouTubeId(src) : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(Boolean(autoPlay));
  const [hasEnded, setHasEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cinemaDim, setCinemaDim] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(autoPlay));
  const [ytReady, setYtReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState(0);
  const [quality, setQuality] = useState("1080p");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [skipFlash, setSkipFlash] = useState<"-10s" | "+10s" | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const effectivePoster =
    poster || (ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  /* ---------- Reset state on src change ---------- */
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(Boolean(autoPlay));
    setHasEnded(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setMediaError(null);
    setIsLoading(kind === "video" || kind === "hls" ? Boolean(autoPlay) : kind === "youtube" && Boolean(autoPlay));
  }, [src, autoPlay, kind]);

  /* ---------- HLS (.m3u8) setup ---------- */
  useEffect(() => {
    if (kind !== "hls" || !videoRef.current) return;
    const video = videoRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsInstance: any = null;
    let cancelled = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    } else {
      loadHlsJs()
        .then(() => {
          if (cancelled || !window.Hls) return;
          if (window.Hls.isSupported()) {
            hlsInstance = new window.Hls();
            hlsRef.current = hlsInstance;
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              const tracks = (hlsInstance.audioTracks || []).map(
                (t: { name?: string; lang?: string }, idx: number) => ({
                  id: idx,
                  name: t.name || t.lang || `${idx + 1}-ovoz yo'lagi`,
                })
              );
              setAudioTracks(tracks);
              const uzIdx = tracks.findIndex((t: { name: string }) =>
                /uz|o'zbek|ozbek|узб/i.test(t.name)
              );
              if (uzIdx >= 0) {
                hlsInstance.audioTrack = uzIdx;
                setActiveAudioTrack(uzIdx);
              }
              if (autoPlay) video.play().catch(() => {});
            });
            hlsInstance.on(window.Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean }) => {
              if (data?.fatal) setMediaError("HLS oqimini yuklab bo'lmadi");
            });
          } else {
            setMediaError("Brauzeringiz HLS (.m3u8) formatini qo'llab-quvvatlamaydi");
          }
        })
        .catch(() => {
          if (!cancelled) setMediaError("HLS pleer kutubxonasini yuklab bo'lmadi");
        });
    }

    return () => {
      cancelled = true;
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [kind, src, autoPlay]);

  /* ---------- YouTube JS API setup (Netflix custom chrome, zero YT UI) ---------- */
  useEffect(() => {
    if (kind !== "youtube" || !ytId || !ytMountRef.current) return;
    let cancelled = false;
    setYtReady(false);

    const mount = ytMountRef.current;
    mount.innerHTML = "";
    const targetDiv = document.createElement("div");
    mount.appendChild(targetDiv);

    loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const player = new window.YT.Player(targetDiv, {
        videoId: ytId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (ev: any) => {
            if (cancelled) return;
            ytPlayerRef.current = ev.target;
            setYtReady(true);
            setIsLoading(false);
            const d = ev.target.getDuration?.() ?? 0;
            if (d > 0) setDuration(d);
            ev.target.setVolume?.(Math.round(volume * 100));
            if (isMuted) ev.target.mute?.();
            if (autoPlay) {
              setHasStarted(true);
              ev.target.playVideo?.();
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (ev: any) => {
            if (cancelled) return;
            const st = ev.data;
            const d = ev.target.getDuration?.() ?? 0;
            if (d > 0) setDuration(d);

            // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
            if (st === 1) {
              setIsPlaying(true);
              setHasStarted(true);
              setHasEnded(false);
              setIsLoading(false);
            } else if (st === 2) {
              setIsPlaying(false);
              setIsLoading(false);
            } else if (st === 3) {
              setIsLoading(true);
            } else if (st === 0) {
              setIsPlaying(false);
              setHasEnded(true);
              setIsLoading(false);
            }
          },
          onError: () => {
            if (!cancelled) {
              setIsLoading(false);
              setMediaError("Videoni ijro etib bo'lmadi. Iltimos, keyinroq urinib ko'ring.");
            }
          },
        },
      });
      ytPlayerRef.current = player;
    });

    return () => {
      cancelled = true;
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      ytPlayerRef.current = null;
      mount.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, ytId]);

  /* ---------- Poll YouTube progress while mounted ---------- */
  useEffect(() => {
    if (kind !== "youtube" || !ytReady) return;
    const id = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const ct = p.getCurrentTime() || 0;
      const dur = p.getDuration?.() || 0;
      const frac = p.getVideoLoadedFraction?.() || 0;
      setCurrentTime(ct);
      if (dur > 0) {
        setDuration(dur);
        setBuffered(frac * dur);
      }
    }, 250);
    return () => clearInterval(id);
  }, [kind, ytReady]);

  /* ---------- Unified playback actions ---------- */
  const togglePlay = useCallback(() => {
    if (kind === "youtube") {
      const p = ytPlayerRef.current;
      if (!p) return;
      if (hasEnded) {
        p.seekTo?.(0, true);
        p.playVideo?.();
        setHasEnded(false);
        setHasStarted(true);
      } else if (isPlaying) {
        p.pauseVideo?.();
      } else {
        setHasStarted(true);
        setIsLoading(true);
        p.playVideo?.();
      }
      resetHideTimer();
      return;
    }

    if (!videoRef.current) return;
    if (hasEnded) {
      videoRef.current.currentTime = 0;
      setHasEnded(false);
    }
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      setHasStarted(true);
      videoRef.current.play().catch(() => {});
    }
    resetHideTimer();
  }, [kind, isPlaying, hasEnded, resetHideTimer]);

  const triggerSkipFlash = (label: "-10s" | "+10s") => {
    setSkipFlash(label);
    if (skipFlashTimerRef.current) clearTimeout(skipFlashTimerRef.current);
    skipFlashTimerRef.current = setTimeout(() => setSkipFlash(null), 550);
  };

  const seek = useCallback(
    (delta: number) => {
      triggerSkipFlash(delta < 0 ? "-10s" : "+10s");
      if (kind === "youtube") {
        const p = ytPlayerRef.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        const target = Math.max(0, Math.min(duration || 99999, (p.getCurrentTime() || 0) + delta));
        p.seekTo?.(target, true);
        setCurrentTime(target);
        resetHideTimer();
        return;
      }
      if (!videoRef.current) return;
      const target = Math.max(0, Math.min(duration || 0, videoRef.current.currentTime + delta));
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      resetHideTimer();
    },
    [kind, duration, resetHideTimer]
  );

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;

    if (kind === "youtube") {
      setHasStarted(true);
      setHasEnded(false);
      ytPlayerRef.current?.seekTo?.(target, true);
      if (!isPlaying) ytPlayerRef.current?.playVideo?.();
      setCurrentTime(target);
    } else if (videoRef.current) {
      setHasStarted(true);
      setHasEnded(false);
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
    resetHideTimer();
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (kind === "youtube") {
      if (nextMuted) ytPlayerRef.current?.mute?.();
      else {
        ytPlayerRef.current?.unMute?.();
        ytPlayerRef.current?.setVolume?.(Math.round((volume || 1) * 100));
      }
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    resetHideTimer();
  }, [isMuted, kind, volume, resetHideTimer]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (kind === "youtube") {
      if (v === 0) ytPlayerRef.current?.mute?.();
      else {
        ytPlayerRef.current?.unMute?.();
        ytPlayerRef.current?.setVolume?.(Math.round(v * 100));
      }
    } else if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    resetHideTimer();
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (kind === "youtube") {
      ytPlayerRef.current?.setPlaybackRate?.(speed);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    resetHideTimer();
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      /* ignore */
    }
  };

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    if (kind === "empty" || kind === "embed") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space" || e.code === "KeyK") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(-10);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(10);
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyM") {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [kind, togglePlay, seek, toggleFullscreen, toggleMute]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  if (kind === "empty") {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl border border-line bg-panel-2 text-muted">
        Video hali yuklanmagan
      </div>
    );
  }

  /* ---------- External Embed Engine (VK Video, Ok.ru, Kodik, Movee, etc.) ---------- */
  if (kind === "embed") {
    return (
      <>
        {cinemaDim && (
          <div
            className="fixed inset-0 z-30 bg-black/90 backdrop-blur-xs transition-opacity"
            onClick={() => setCinemaDim(false)}
          />
        )}
        <div
          ref={containerRef}
          className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black ${
            cinemaDim ? "z-40 shadow-2xl shadow-black" : ""
          }`}
        >
          <iframe
            src={src}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={title}
          />
          <button
            onClick={() => setCinemaDim((v) => !v)}
            className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white hover:border-[#E50914]"
          >
            {cinemaDim ? <Sun className="h-3.5 w-3.5 text-gold" /> : <Moon className="h-3.5 w-3.5" />}
            {cinemaDim ? "Chiroqni yoqish" : "Kinozal rejimi"}
          </button>
        </div>
      </>
    );
  }

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferPercent = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  return (
    <>
      {cinemaDim && !isFullscreen && (
        <div
          className="fixed inset-0 z-30 bg-black/92 transition-opacity"
          onClick={() => setCinemaDim(false)}
        />
      )}

      <div
        ref={containerRef}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
            setShowSpeedMenu(false);
            setShowQualityMenu(false);
          }
        }}
        className={`group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black select-none ${
          isFullscreen ? "h-screen w-screen rounded-none border-0" : ""
        } ${cinemaDim && !isFullscreen ? "z-40 ring-1 ring-[#E50914]/50 shadow-2xl" : ""}`}
      >
        {/* ENGINE A: Native Video / HLS */}
        {(kind === "video" || kind === "hls") && (
          <video
            key={kind === "video" ? src : "hls-video"}
            ref={videoRef}
            src={kind === "video" ? src : undefined}
            poster={effectivePoster}
            autoPlay={autoPlay}
            playsInline
            preload="metadata"
            onPlay={() => {
              setIsPlaying(true);
              setHasStarted(true);
              setHasEnded(false);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setHasEnded(true);
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                if (videoRef.current.buffered.length > 0) {
                  setBuffered(
                    videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
                  );
                }
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setIsLoading(false);
              }
            }}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setMediaError("Video faylni yuklab bo'lmadi yoki manzil eskirgan.");
            }}
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            className="h-full w-full cursor-pointer object-contain"
          />
        )}

        {/* ENGINE B: Streamed Cinema Engine (300% height crops 100% of YT chrome while keeping 16:9 intact) */}
        {kind === "youtube" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden bg-black">
            <div className="relative aspect-video max-h-full w-full overflow-hidden">
              <div
                ref={ytMountRef}
                className="pointer-events-none absolute left-0 -top-full h-[300%] w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
              />
            </div>
          </div>
        )}

        {/* Transparent Click / Double-Click Shield for Streamed Engine */}
        {kind === "youtube" && (
          <div
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        )}

        {/* Poster Cover before playback starts or after video ends */}
        {(!hasStarted || hasEnded) && effectivePoster && !mediaError && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-10 cursor-pointer overflow-hidden bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effectivePoster}
              alt={title}
              className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60" />
          </div>
        )}

        {/* Error Overlay */}
        {mediaError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <p className="text-base font-bold text-white">{mediaError}</p>
            <p className="mt-1 text-xs text-white/60">
              Admin panel orqali yangi MP4, HLS (.m3u8) yoki video havolasini kiritishingiz mumkin.
            </p>
          </div>
        )}

        {/* Skip -10s / +10s Visual Feedback */}
        {skipFlash && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
            <div className="animate-spin-pop rounded-full bg-black/75 px-6 py-3 text-lg font-extrabold text-white ring-1 ring-white/20 backdrop-blur-md">
              {skipFlash === "-10s" ? "⏪ -10 soniya" : "+10 soniya ⏩"}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !mediaError && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/30">
            <Loader2 className="h-14 w-14 animate-spin text-[#E50914]" />
          </div>
        )}

        {/* Center Netflix Play / Replay Button when Paused */}
        {!isPlaying && !isLoading && !mediaError && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-20 grid cursor-pointer place-items-center bg-black/35 transition-opacity duration-300"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[#E50914] text-white shadow-2xl shadow-[#E50914]/60 ring-4 ring-white/15 transition duration-200 hover:scale-110 active:scale-95">
                {hasEnded ? (
                  <RotateCcw className="h-9 w-9" />
                ) : (
                  <Play className="ml-1 h-9 w-9 fill-white" />
                )}
              </div>
              {!hasStarted && (
                <span className="rounded-full bg-black/70 px-4 py-1 text-xs font-bold tracking-wide text-white/90 backdrop-blur-sm">
                  {hasEnded ? "Qayta ko'rish" : "Tomosha qilishni boshlash"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Top Header Overlay */}
        <div
          className={`absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/45 to-transparent p-4 sm:p-5 transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#E50914] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  N
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#E50914]">
                  {studio || "ASILKINO"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
                  {quality}
                </span>
              </div>
              <h2 className="mt-0.5 line-clamp-1 text-sm sm:text-base font-bold text-white drop-shadow-md">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFullscreen && (
              <button
                onClick={() => setCinemaDim((v) => !v)}
                className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/20 bg-black/55 px-2.5 py-1 text-xs font-semibold text-white/90 hover:border-[#E50914] hover:text-white transition"
                title="Atrofni qoraytirish (Kinozal rejimi)"
              >
                {cinemaDim ? (
                  <Sun className="h-3.5 w-3.5 text-gold" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                <span>{cinemaDim ? "Chiroqni yoqish" : "Chiroqni o'chirish"}</span>
              </button>
            )}
            <span className="rounded-md border border-white/20 bg-black/55 px-2.5 py-1 text-xs font-semibold text-white/90">
              O&apos;zbek tilida • HD
            </span>
          </div>
        </div>

        {/* Bottom Netflix Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pb-3 pt-10 sm:px-5 sm:pb-4 transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Scrubber Progress Bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
            className="group/progress relative mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/25 transition-all hover:h-2.5"
          >
            <div
              style={{ width: `${bufferPercent}%` }}
              className="absolute bottom-0 left-0 top-0 rounded-full bg-white/35"
            />
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute bottom-0 left-0 top-0 rounded-full bg-[#E50914]"
            >
              <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#E50914] opacity-0 shadow-md ring-2 ring-white transition-opacity group-hover/progress:opacity-100" />
            </div>

            {hoverTime !== null && (
              <div
                style={{ left: `${hoverPosition}%` }}
                className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded border border-white/20 bg-black/95 px-2 py-0.5 text-[11px] font-semibold text-white"
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={togglePlay}
                className="rounded-full p-1.5 sm:p-2 text-white hover:text-[#E50914] transition"
                title={isPlaying ? "To'xtatish (Space)" : "Ijro etish (Space)"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 fill-current" />
                )}
              </button>

              <button
                onClick={() => seek(-10)}
                className="rounded-full p-1.5 sm:p-2 text-white/85 hover:text-white transition"
                title="10 soniya orqaga (←)"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <button
                onClick={() => seek(10)}
                className="rounded-full p-1.5 sm:p-2 text-white/85 hover:text-white transition"
                title="10 soniya oldinga (→)"
              >
                <RotateCw className="h-5 w-5" />
              </button>

              {/* Volume */}
              <div className="group/volume relative flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="rounded-full p-1.5 sm:p-2 text-white/85 hover:text-white transition"
                  title={isMuted ? "Ovozni yoqish (M)" : "Ovozni o'chirish (M)"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5 text-red-400" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden sm:block h-1 w-0 origin-left cursor-pointer accent-[#E50914] transition-all duration-200 group-hover/volume:w-20"
                />
              </div>

              <div className="ml-1 text-xs font-medium text-white/75 tabular-nums">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="mx-1 text-white/40">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Multi-Audio Track Switcher (HLS streams with Uzbek/Russian/English tracks) */}
              {audioTracks.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowAudioMenu(!showAudioMenu);
                      setShowSpeedMenu(false);
                      setShowQualityMenu(false);
                    }}
                    className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/95 hover:border-[#E50914] transition"
                    title="Ovoz tilini tanlash"
                  >
                    🎧 {audioTracks[activeAudioTrack]?.name || "Til"}
                  </button>
                  {showAudioMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-40 rounded-xl border border-white/15 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white/40">
                        Ovoz tili
                      </div>
                      {audioTracks.map((tr) => (
                        <button
                          key={tr.id}
                          onClick={() => {
                            if (hlsRef.current) hlsRef.current.audioTrack = tr.id;
                            setActiveAudioTrack(tr.id);
                            setShowAudioMenu(false);
                          }}
                          className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition ${
                            activeAudioTrack === tr.id
                              ? "bg-[#E50914] font-bold text-white"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {tr.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
                  title="Ijro tezligi"
                >
                  <Sliders className="h-4 w-4" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-white/15 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white/40">
                      Tezlik
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition ${
                          playbackSpeed === s
                            ? "bg-[#E50914] font-bold text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {s === 1 ? "Oddiy (1x)" : `${s}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-bold text-white/95 hover:border-[#E50914] hover:text-[#E50914] transition"
                  title="Tasvir sifati"
                >
                  {quality}
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border border-white/15 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white/40">
                      Sifat
                    </div>
                    {["4K Ultra HD", "1080p Full HD", "720p HD", "480p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q.split(" ")[0]);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition ${
                          quality === q.split(" ")[0]
                            ? "bg-[#E50914] font-bold text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP (native video only) */}
              {(kind === "video" || kind === "hls") && (
                <button
                  onClick={togglePiP}
                  className="hidden sm:inline-flex rounded-full p-2 text-white/85 hover:text-white transition"
                  title="Kichik oynada ko'rish (PiP)"
                >
                  <Tv className="h-5 w-5" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="rounded-full p-1.5 sm:p-2 text-white/85 hover:text-white transition"
                title="To'liq ekran (F)"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

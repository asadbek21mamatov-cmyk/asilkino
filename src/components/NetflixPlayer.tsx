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
} from "lucide-react";

interface NetflixPlayerProps {
  src: string;
  poster?: string;
  title: string;
  studio?: string;
  autoPlay?: boolean;
  onBack?: () => void;
}

export default function NetflixPlayer({
  src,
  poster,
  title,
  studio,
  autoPlay = false,
  onBack,
}: NetflixPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [quality, setQuality] = useState("1080p");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
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

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    resetHideTimer();
  }, [isPlaying, resetHideTimer]);

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    resetHideTimer();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
    resetHideTimer();
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    resetHideTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
    resetHideTimer();
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    resetHideTimer();
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcuts (Space: play/pause, Arrows: seek/volume, F: fullscreen, M: mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

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
  }, [togglePlay, toggleFullscreen]);

  // Sync fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
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
      className={`group relative aspect-video w-full overflow-hidden rounded-2xl bg-black select-none ${
        isFullscreen ? "h-screen w-screen rounded-none" : ""
      }`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.buffered.length > 0) {
              setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
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
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="h-full w-full object-contain cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30">
          <Loader2 className="h-14 w-14 animate-spin text-[#E50914]" />
        </div>
      )}

      {/* Center Play/Pause Flash Overlay */}
      {!isPlaying && !isLoading && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-black/40 cursor-pointer transition-opacity duration-300"
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#E50914] text-white shadow-2xl shadow-[#E50914]/50 transition transform hover:scale-110 active:scale-95">
            <Play className="ml-1 h-9 w-9 fill-white" />
          </div>
        </div>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent p-5 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#E50914]">
                {studio || "NETFLIX"}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                ULTRA HD
              </span>
            </div>
            <h2 className="text-base font-bold text-white drop-shadow-md">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs font-semibold text-white/90">
            O&apos;zbek tilida
          </span>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pb-4 pt-12 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
          className="group/progress relative mb-3 h-2 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-3"
        >
          {/* Buffer Bar */}
          <div
            style={{ width: `${bufferPercent}%` }}
            className="absolute top-0 bottom-0 left-0 rounded-full bg-white/30"
          />

          {/* Played Bar */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 left-0 rounded-full bg-[#E50914]"
          >
            {/* Scrubber Handle */}
            <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#E50914] shadow-md ring-2 ring-white opacity-0 transition-opacity group-hover/progress:opacity-100" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              style={{ left: `${hoverPosition}%` }}
              className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 text-[11px] font-semibold text-white border border-white/20"
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="rounded-full p-2 text-white hover:text-[#E50914] transition"
              title={isPlaying ? "To'xtatish (Space)" : "Ijro etish (Space)"}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
            </button>

            <button
              onClick={() => seek(-10)}
              className="rounded-full p-2 text-white/80 hover:text-white transition"
              title="10 soniya orqaga (←)"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={() => seek(10)}
              className="rounded-full p-2 text-white/80 hover:text-white transition"
              title="10 soniya oldinga (→)"
            >
              <RotateCw className="h-5 w-5" />
            </button>

            {/* Volume Control */}
            <div className="group/volume relative flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="rounded-full p-2 text-white/80 hover:text-white transition"
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
                className="h-1 w-0 origin-left accent-[#E50914] transition-all duration-200 group-hover/volume:w-20 cursor-pointer"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-xs font-medium text-white/70 ml-2">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="mx-1 text-white/40">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                title="Tezlik"
              >
                <Sliders className="h-4 w-4" />
                <span>{playbackSpeed === 1 ? "1x" : `${playbackSpeed}x`}</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-white/15 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white/40">Tezlik</div>
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

            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-bold text-white/90 hover:border-[#E50914] hover:text-[#E50914] transition"
                title="Sifat"
              >
                {quality}
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border border-white/15 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white/40">Sifat</div>
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

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="rounded-full p-2 text-white/80 hover:text-white transition"
              title="Kichik oynada ko'rish (PiP)"
            >
              <Tv className="h-5 w-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="rounded-full p-2 text-white/80 hover:text-white transition"
              title="To'liq ekran (F)"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

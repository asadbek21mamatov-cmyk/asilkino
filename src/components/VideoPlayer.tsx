"use client";

import { useState } from "react";
import { AlertCircle, Play } from "lucide-react";

function youtubeEmbed(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/** MP4/WebM havolalar uchun HTML5 pleer, YouTube va boshqa embed havolalar uchun iframe. */
export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  fallbackUrl,
}: {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  fallbackUrl?: string;
}) {
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const activeSrc = useFallback && fallbackUrl ? fallbackUrl : src;

  if (!activeSrc) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-xl bg-panel-2 text-muted">
        Video hali yuklanmagan
      </div>
    );
  }

  const yt = youtubeEmbed(activeSrc);
  const isFile = /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(activeSrc);

  if (yt || !isFile) {
    return (
      <iframe
        src={yt ? `${yt}${autoPlay ? "?autoplay=1" : ""}` : activeSrc}
        className="aspect-video w-full rounded-xl bg-black border border-line"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Video pleer"
      />
    );
  }

  if (error) {
    const fallbackYt = fallbackUrl ? youtubeEmbed(fallbackUrl) : null;
    return (
      <div className="flex flex-col items-center justify-center aspect-video w-full rounded-xl bg-panel-2 border border-line p-6 text-center">
        <AlertCircle className="h-10 w-10 text-accent mb-2" />
        <p className="font-semibold text-sm">Ushbu video serveri vaqtincha javob bermadi</p>
        <p className="text-xs text-muted mt-1 max-w-md">
          Video havolasi eskirgan yoki ruxsat cheklangan bo&apos;lishi mumkin.
        </p>
        {fallbackUrl && !useFallback && (
          <button
            onClick={() => {
              setError(false);
              setUseFallback(true);
            }}
            className="btn btn-primary mt-4 text-xs"
          >
            <Play className="h-3.5 w-3.5 fill-white" /> Muqobil videoni (YouTube) yoqish
          </button>
        )}
      </div>
    );
  }

  return (
    <video
      key={activeSrc}
      src={activeSrc}
      poster={poster}
      controls
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      onError={() => setError(true)}
      className="aspect-video w-full rounded-xl bg-black border border-line"
    />
  );
}

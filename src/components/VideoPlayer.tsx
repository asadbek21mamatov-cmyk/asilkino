"use client";

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/** MP4/WebM havolalar uchun HTML5 pleer, YouTube va boshqa embed havolalar uchun iframe. */
export default function VideoPlayer({ src, poster, autoPlay = false }: { src: string; poster?: string; autoPlay?: boolean }) {
  if (!src) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-xl bg-black text-muted">Video hali qo&apos;shilmagan</div>
    );
  }

  const yt = youtubeEmbed(src);
  const isFile = /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(src);

  if (yt || !isFile) {
    return (
      <iframe
        src={yt ? `${yt}${autoPlay ? "?autoplay=1" : ""}` : src}
        className="aspect-video w-full rounded-xl bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Video pleer"
      />
    );
  }

  return (
    <video
      key={src}
      src={src}
      poster={poster}
      controls
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      className="aspect-video w-full rounded-xl bg-black"
    />
  );
}

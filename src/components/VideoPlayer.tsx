"use client";

import NetflixPlayer from "./NetflixPlayer";

export default function VideoPlayer({
  src,
  poster,
  title = "Film",
  studio = "AsilKino",
  autoPlay = false,
}: {
  src: string;
  poster?: string;
  title?: string;
  studio?: string;
  autoPlay?: boolean;
  fallbackUrl?: string;
}) {
  return (
    <NetflixPlayer
      src={src}
      poster={poster}
      title={title}
      studio={studio}
      autoPlay={autoPlay}
    />
  );
}

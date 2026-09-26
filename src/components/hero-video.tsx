"use client";

import { useEffect, useRef } from "react";

/** The homepage film. It pauses once it leaves the screen so scrolling the
 * rest of the page is not decoding video at the same time. */
export function HeroVideo({ poster, src }: { poster: string; src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      autoPlay
      className="absolute inset-0 -z-20 h-full w-full object-cover"
      loop
      muted
      playsInline
      poster={poster}
      preload="auto"
      ref={ref}
      src={src}
    />
  );
}

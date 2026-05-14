'use client';

import React from 'react';
import { VolumeX, Volume2 } from 'lucide-react';

interface BackgroundProps {
  mediaType: 'video' | 'image' | 'gif';
  mediaSrc: string;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  blurAmount: number;
}

export function Background({
  mediaType,
  mediaSrc,
  muted,
  setMuted,
  videoRef,
  blurAmount,
}: BackgroundProps) {
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <>
      {mediaType === 'video' && (
        <>
          <video
            key={mediaSrc}
            ref={videoRef}
            src={mediaSrc}
            autoPlay
            loop
            muted={muted}
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={toggleMute}
            className="absolute right-6 bottom-6 z-20 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </>
      )}

      {(mediaType === 'image' || mediaType === 'gif') && (
        // eslint-disable-next-line @next/next/no-img-element -- user-provided wallpaper URLs
        <img
          key={mediaSrc}
          src={mediaSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div
        className="absolute inset-0 bg-black/40 transition-all duration-300"
        style={{ backdropFilter: `blur(${blurAmount}px)` }}
      />
    </>
  );
}

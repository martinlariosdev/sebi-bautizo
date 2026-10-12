"use client";

import { useRef, useState } from "react";

const AUDIO_SRC = "/latido.m4a";
const START_OFFSET_SECONDS = 9;
const LABEL_BASE = "audio: el latido que cambió nuestras vidas";

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clipDuration, setClipDuration] = useState(0);
  const [clipTime, setClipTime] = useState(0);

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setClipDuration(Math.max(audio.duration - START_OFFSET_SECONDS, 0));
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setClipTime(Math.max(audio.currentTime - START_OFFSET_SECONDS, 0));
  }

  function handleEnded() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = START_OFFSET_SECONDS;
    setClipTime(0);
    setIsPlaying(false);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    if (audio.currentTime < START_OFFSET_SECONDS) {
      audio.currentTime = START_OFFSET_SECONDS;
      setClipTime(0);
    }
    audio.play();
    setIsPlaying(true);
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const relative = Number(event.target.value);
    audio.currentTime = START_OFFSET_SECONDS + relative;
    setClipTime(relative);
  }

  const progressFraction = clipDuration > 0 ? clipTime / clipDuration : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={`${isPlaying ? "Pausar" : "Reproducir"} ${LABEL_BASE}`}
        aria-pressed={isPlaying}
        className="absolute rounded-full"
        style={{ top: "47.9%", left: "28.9%", width: "6.9%", height: "2.9%" }}
      >
        {isPlaying && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center gap-[2px]"
          >
            <span className="h-[45%] w-[14%] bg-[#f2efe9]" />
            <span className="h-[45%] w-[14%] bg-[#f2efe9]" />
          </span>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={clipDuration}
        step={0.01}
        value={clipTime}
        onChange={handleSeek}
        aria-label={`Progreso del ${LABEL_BASE}`}
        className="absolute cursor-pointer opacity-0"
        style={{ top: "47.6%", left: "37.9%", width: "46.8%", height: "3.5%" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-[1.4%] w-[1.4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2c4f6e]"
        style={{
          top: "49.3%",
          left: `calc(37.9% + ${progressFraction * 46.8}%)`,
        }}
      />
    </>
  );
}

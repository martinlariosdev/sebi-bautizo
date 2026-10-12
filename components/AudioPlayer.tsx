"use client";

import { useEffect, useRef, useState } from "react";
import { computePeaks } from "@/lib/waveform";
import { formatClockTime } from "@/lib/time";

const AUDIO_SRC = "/latido.m4a";
const START_OFFSET_SECONDS = 9;
const LABEL_BASE = "audio: el latido que cambió nuestras vidas";
const BAR_COUNT = 40;
const FLAT_PEAKS = Array(BAR_COUNT).fill(0);

// Positions measured by sampling the flyer image's pixels (see docs/superpowers).
const WAVEFORM_POSITION = { top: "43.8%", left: "35.5%", width: "37%", height: "3.0%" };
const TIME_ROW_POSITION = { top: "46.0%", left: "35%", width: "60%", height: "2.3%" };
const FLYER_BACKGROUND = "#f1eee6";

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clipDuration, setClipDuration] = useState(0);
  const [clipTime, setClipTime] = useState(0);
  const [peaks, setPeaks] = useState<number[]>(FLAT_PEAKS);

  useEffect(() => {
    let cancelled = false;

    async function loadWaveform() {
      try {
        const response = await fetch(AUDIO_SRC);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextClass();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const startSample = Math.floor(START_OFFSET_SECONDS * audioBuffer.sampleRate);
        const computed = computePeaks(channelData, startSample, BAR_COUNT);
        const max = Math.max(...computed, 0.01);
        if (!cancelled) setPeaks(computed.map((p) => p / max));
        audioContext.close?.();
      } catch {
        // Keep the flat placeholder bars if decoding isn't available.
      }
    }

    loadWaveform();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function syncDuration() {
      setClipDuration(Math.max(audio!.duration - START_OFFSET_SECONDS, 0));
    }
    function syncTime() {
      setClipTime(Math.max(audio!.currentTime - START_OFFSET_SECONDS, 0));
    }
    function onEnded() {
      audio!.currentTime = START_OFFSET_SECONDS;
      setClipTime(0);
      setIsPlaying(false);
    }

    // A small same-origin file can finish loading metadata before this
    // effect attaches its listeners — sync eagerly if it already has.
    if (audio.readyState >= 1) syncDuration();

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

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
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const relative = Number(event.target.value);
    audio.currentTime = START_OFFSET_SECONDS + relative;
    setClipTime(relative);
  }

  const playedBarCount =
    clipDuration > 0 ? Math.floor((clipTime / clipDuration) * BAR_COUNT) : 0;

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={`${isPlaying ? "Pausar" : "Reproducir"} ${LABEL_BASE}`}
        aria-pressed={isPlaying}
        className="absolute rounded-full"
        style={{ top: "44.1%", left: "27.2%", width: "7.0%", height: "2.4%" }}
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

      {/* Covers the flyer's static waveform artwork so the real one can render on top. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ ...WAVEFORM_POSITION, backgroundColor: FLYER_BACKGROUND }}
      />
      <div aria-hidden="true" className="absolute flex items-center gap-[2.5%]" style={WAVEFORM_POSITION}>
        {peaks.map((peak, index) => (
          <span
            key={index}
            data-testid="waveform-bar"
            data-played={index < playedBarCount}
            className="flex-1 rounded-full"
            style={{
              height: `${15 + peak * 85}%`,
              backgroundColor: index < playedBarCount ? "#2c4f6e" : "#b7c6d1",
            }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={clipDuration}
        step={0.01}
        value={clipTime}
        onChange={handleSeek}
        aria-label={`Progreso del ${LABEL_BASE}`}
        className="absolute cursor-pointer opacity-0"
        style={WAVEFORM_POSITION}
      />

      {/* Covers the flyer's static "0:00 | 0:28" text so the live counter can replace it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ ...TIME_ROW_POSITION, backgroundColor: FLYER_BACKGROUND }}
      />
      <span
        data-testid="time-display"
        className="pointer-events-none absolute flex items-center justify-end font-serif text-[2.6vw] text-[#8a7a5c] sm:text-base"
        style={TIME_ROW_POSITION}
      >
        {formatClockTime(clipTime)} | {formatClockTime(clipDuration)}
      </span>
    </>
  );
}

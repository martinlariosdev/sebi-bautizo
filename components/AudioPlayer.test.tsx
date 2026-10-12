import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AudioPlayer } from "./AudioPlayer";

const BAR_COUNT = 40;

function getAudioEl(container: HTMLElement) {
  return container.querySelector("audio") as HTMLAudioElement;
}

describe("AudioPlayer", () => {
  it("renders an audio element pointing at the heartbeat clip", () => {
    const { container } = render(<AudioPlayer />);
    expect(getAudioEl(container)).toHaveAttribute("src", "/latido.m4a");
  });

  it("starts paused, showing the 'play' label", () => {
    render(<AudioPlayer />);
    const button = screen.getByRole("button", {
      name: "Reproducir audio: el latido que cambió nuestras vidas",
    });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("jumps to second 9 on first play and switches to the 'pause' label", () => {
    const { container } = render(<AudioPlayer />);
    const audio = getAudioEl(container);
    const playSpy = vi.spyOn(audio, "play");

    fireEvent.click(
      screen.getByRole("button", { name: "Reproducir audio: el latido que cambió nuestras vidas" })
    );

    expect(audio.currentTime).toBe(9);
    expect(playSpy).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Pausar audio: el latido que cambió nuestras vidas" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("pauses without reseeking on a second click", () => {
    const { container } = render(<AudioPlayer />);
    const audio = getAudioEl(container);
    const pauseSpy = vi.spyOn(audio, "pause");

    const button = screen.getByRole("button", {
      name: "Reproducir audio: el latido que cambió nuestras vidas",
    });
    fireEvent.click(button);
    fireEvent.click(
      screen.getByRole("button", { name: "Pausar audio: el latido que cambió nuestras vidas" })
    );

    expect(pauseSpy).toHaveBeenCalled();
    expect(audio.currentTime).toBe(9);
    expect(
      screen.getByRole("button", { name: "Reproducir audio: el latido que cambió nuestras vidas" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes a seek slider sized to the trimmed clip once metadata loads", () => {
    const { container } = render(<AudioPlayer />);
    const audio = getAudioEl(container);
    Object.defineProperty(audio, "duration", { value: 21.4, configurable: true });
    fireEvent(audio, new Event("loadedmetadata"));

    const slider = screen.getByRole("slider", {
      name: "Progreso del audio: el latido que cambió nuestras vidas",
    });
    expect(Number(slider.getAttribute("max"))).toBeCloseTo(12.4, 5);
  });

  it("seeking the slider moves the audio to second 9 + the chosen offset", () => {
    const { container } = render(<AudioPlayer />);
    const audio = getAudioEl(container);
    Object.defineProperty(audio, "duration", { value: 21.4, configurable: true });
    fireEvent(audio, new Event("loadedmetadata"));

    const slider = screen.getByRole("slider", {
      name: "Progreso del audio: el latido que cambió nuestras vidas",
    });
    fireEvent.change(slider, { target: { value: "5" } });

    expect(audio.currentTime).toBe(14);
  });

  it("resets to the start and switches back to 'play' when the clip ends", () => {
    const { container } = render(<AudioPlayer />);
    const audio = getAudioEl(container);
    fireEvent.click(
      screen.getByRole("button", { name: "Reproducir audio: el latido que cambió nuestras vidas" })
    );

    fireEvent(audio, new Event("ended"));

    expect(audio.currentTime).toBe(9);
    expect(
      screen.getByRole("button", { name: "Reproducir audio: el latido que cambió nuestras vidas" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("renders one waveform bar per computed peak once the audio decodes", async () => {
    render(<AudioPlayer />);
    const bars = await screen.findAllByTestId("waveform-bar");
    expect(bars).toHaveLength(BAR_COUNT);
  });

  it("marks only the bars up to the current playback position as played", async () => {
    const { container } = render(<AudioPlayer />);
    await screen.findAllByTestId("waveform-bar");
    const audio = getAudioEl(container);
    Object.defineProperty(audio, "duration", { value: 21.4, configurable: true });
    fireEvent(audio, new Event("loadedmetadata"));
    Object.defineProperty(audio, "currentTime", { value: 15.4, configurable: true }); // 6.4s into the clip
    fireEvent(audio, new Event("timeupdate"));

    const bars = screen.getAllByTestId("waveform-bar");
    const playedCount = bars.filter((bar) => bar.getAttribute("data-played") === "true").length;
    // 6.4s of ~12.4s ≈ the first half of the bars
    expect(playedCount).toBeGreaterThan(0);
    expect(playedCount).toBeLessThan(BAR_COUNT);
  });

  it("shows a live time display that updates as the clip plays", async () => {
    const { container } = render(<AudioPlayer />);
    await screen.findAllByTestId("waveform-bar");
    const audio = getAudioEl(container);
    Object.defineProperty(audio, "duration", { value: 21.4, configurable: true });
    fireEvent(audio, new Event("loadedmetadata"));

    expect(screen.getByTestId("time-display")).toHaveTextContent("0:00 | 0:12");

    Object.defineProperty(audio, "currentTime", { value: 14, configurable: true }); // 5s into the clip
    fireEvent(audio, new Event("timeupdate"));

    expect(screen.getByTestId("time-display")).toHaveTextContent("0:05 | 0:12");
  });
});

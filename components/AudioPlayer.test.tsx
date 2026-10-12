import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AudioPlayer } from "./AudioPlayer";

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
});
